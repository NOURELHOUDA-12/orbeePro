const db = require('../config/db');

class Devis {

  // ── Générer référence unique ───────────────────────────────────────────────
  static async generateReference() {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm   = String(date.getMonth() + 1).padStart(2, '0');
    const [rows] = await db.execute(
      `SELECT COUNT(*) AS cnt FROM devis WHERE YEAR(created_at) = ?`, [yyyy]
    );
    const num = String(rows[0].cnt + 1).padStart(4, '0');
    return `DEV-${yyyy}${mm}-${num}`;
  }

  static async findAll({ fournisseurId, statut } = {}) {
    let sql = `
      SELECT
        d.*,
        f.nom AS fournisseur_nom,
        COUNT(dl.id) AS lignes_count
      FROM devis d
      LEFT JOIN fournisseurs f  ON f.id  = d.fournisseur_id
      LEFT JOIN devis_lignes dl ON dl.devis_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (fournisseurId) {
      sql += ` AND d.fournisseur_id = ?`;
      params.push(fournisseurId);
    }
    if (statut) {
      sql += ` AND d.statut = ?`;
      params.push(statut);
    }

    sql += ` GROUP BY d.id ORDER BY d.created_at DESC`;
    const [rows] = await db.execute(sql, params);
    return rows.map(Devis.format);
  }

  static async findById(id) {
    // Devis
    const [rows] = await db.execute(`
      SELECT d.*, f.nom AS fournisseur_nom, f.email AS fournisseur_email
      FROM devis d
      LEFT JOIN fournisseurs f ON f.id = d.fournisseur_id
      WHERE d.id = ?
    `, [id]);

    if (!rows[0]) return null;
    const devis = Devis.format(rows[0]);

    // Lignes
    const [lignes] = await db.execute(`
      SELECT dl.*, p.nom AS produit_nom
      FROM devis_lignes dl
      LEFT JOIN produits p ON p.id = dl.produit_id
      WHERE dl.devis_id = ?
      ORDER BY dl.ordre ASC
    `, [id]);

    devis.lignes = lignes.map(l => ({
      id:           l.id,
      produitId:    l.produit_id,
      produitNom:   l.produit_nom,
      designation:  l.designation,
      quantite:     parseFloat(l.quantite),
      prixUnitaire: parseFloat(l.prix_unitaire),
      totalLigne:   parseFloat(l.total_ligne),
      unite:        l.unite,
      ordre:        l.ordre,
    }));

    return devis;
  }

  static async create({ fournisseurId, lignes = [], notes, dateValidite, }) {
    const reference = await Devis.generateReference();

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Insérer devis
      const [result] = await conn.execute(`
        INSERT INTO devis
          (fournisseur_id, reference, statut, notes, date_validite)
        VALUES (?, ?, 'brouillon', ?, ?)
      `, [fournisseurId, reference,
           notes || null, dateValidite || null]);

      const devisId = result.insertId;

      // Insérer lignes
      for (let i = 0; i < lignes.length; i++) {
        const l = lignes[i];
        // const totalLigne = l.quantite * l.prixUnitaire;
        await conn.execute(`
          INSERT INTO devis_lignes
            (devis_id, produit_id, designation, quantite, unite, ordre)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [devisId, l.produitId || null, l.designation,
            l.quantite, 
            l.unite || 'unité', i]);
      }

      await conn.commit();
      return Devis.findById(devisId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

 static async update(id, data) {

  const { lignes = [], notes, dateValidite } = data;
  const conn = await db.getConnection();


  try {
    await conn.beginTransaction();

    await conn.execute(`
      UPDATE devis
      SET notes = ?, date_validite = ?
      WHERE id = ? AND statut = 'brouillon'
    `, [notes || null, dateValidite || null, id]);

    await conn.execute(`DELETE FROM devis_lignes WHERE devis_id = ?`, [id]);

    for (let i = 0; i < lignes.length; i++) {
      
      const l = lignes[i];
      await conn.execute(`
        INSERT INTO devis_lignes
          (devis_id, produit_id, designation, quantite, unite, ordre)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [id, l.produitId || null, l.designation,
          l.quantite, l.unite || 'unité', i]);
    }

    await conn.commit();
    return Devis.findById(id);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}



  // ── Envoyer le devis par email ────────────────────────────────────────────
  static async envoyer(id) {
    const devis = await Devis.findById(id);
    if (!devis) throw new Error('Devis introuvable');
    if (devis.statut !== 'brouillon') throw new Error('Seul un brouillon peut être envoyé');

    await db.execute(`
      UPDATE devis SET statut = 'envoye', date_envoi = NOW() WHERE id = ?
    `, [id]);

    return Devis.findById(id);
  }

  static async changerStatut(id, statut) {
    console.log(statut)
    await db.execute(`UPDATE devis SET statut = ? WHERE id = ?`, [statut, id]);
    return Devis.findById(id);
  }

  static async delete(id) {
    const [result] = await db.execute(`DELETE FROM devis WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  static format(row) {
    return {
      id:             row.id,
      fournisseurId:  row.fournisseur_id,
      fournisseurNom: row.fournisseur_nom,
      fournisseurEmail: row.fournisseur_email,
      reference:      row.reference,
      statut:         row.statut,
      totalHT:        parseFloat(row.total_ht),
      tauxTva:        parseFloat(row.taux_tva),
      totalTva:       parseFloat(row.total_tva),
      totalTTC:       parseFloat(row.total_ttc),
      notes:          row.notes,
      dateEnvoi:      row.date_envoi,
      dateValidite:   row.date_validite,
      lignesCount:    row.lignes_count || 0,
      createdAt:      row.created_at,
      updatedAt:      row.updated_at,
      lignes:         [],
    };
  }
}

module.exports = Devis;