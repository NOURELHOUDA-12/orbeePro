const db = require('../config/db');

class Commande {

  // ── Générer référence unique ───────────────────────────────────────────────
  static async generateReference() {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm   = String(date.getMonth() + 1).padStart(2, '0');
    const [rows] = await db.execute(
      `SELECT COUNT(*) AS cnt FROM commandes WHERE YEAR(created_at) = ?`, [yyyy]
    );
    const num = String(rows[0].cnt + 1).padStart(4, '0');
    return `CMD-${yyyy}${mm}-${num}`;
  }

  static async findAll({ fournisseurId, statut } = {}) {
    let sql = `
      SELECT
        c.*,
        f.nom AS fournisseur_nom,
        COUNT(cl.id) AS lignes_count
      FROM commandes c
      LEFT JOIN fournisseurs f    ON f.id = c.fournisseur_id
      LEFT JOIN commande_lignes cl ON cl.commande_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (fournisseurId) {
      sql += ` AND c.fournisseur_id = ?`;
      params.push(fournisseurId);
    }
    if (statut) {
      sql += ` AND c.statut = ?`;
      params.push(statut);
    }

    sql += ` GROUP BY c.id ORDER BY c.created_at DESC`;
    const [rows] = await db.execute(sql, params);
    return rows.map(Commande.format);
  }

  static async findById(id) {
    const [rows] = await db.execute(`
      SELECT c.*,
      f.nom       AS fournisseur_nom,
      f.email     AS fournisseur_email,
      f.telephone AS fournisseur_telephone,
      f.adresse   AS fournisseur_adresse
    FROM commandes c
    LEFT JOIN fournisseurs f ON f.id = c.fournisseur_id
    WHERE c.id = ?
  `, [id]);

    if (!rows[0]) return null;
    const commande = Commande.format(rows[0]);

    const [lignes] = await db.execute(`
      SELECT cl.*, p.nom AS produit_nom
      FROM commande_lignes cl
      LEFT JOIN produits p ON p.id = cl.produit_id
      WHERE cl.commande_id = ?
      ORDER BY cl.ordre ASC
    `, [id]);

    commande.lignes = lignes.map(l => ({
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

    return commande;
  }

  static async create({ fournisseurId, lignes = [], notes, tauxTva = 19 }) {
    const reference = await Commande.generateReference();

    const totalHT  = lignes.reduce((s, l) => s + (l.quantite * l.prixUnitaire), 0);
    const totalTVA = totalHT * (tauxTva / 100);
    const totalTTC = totalHT + totalTVA;

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.execute(`
        INSERT INTO commandes
          (fournisseur_id, reference, statut, taux_tva, total_ht, total_tva, total_ttc, notes)
        VALUES (?, ?, 'brouillon', ?, ?, ?, ?, ?)
      `, [fournisseurId, reference, tauxTva,
          totalHT.toFixed(3), totalTVA.toFixed(3), totalTTC.toFixed(3), notes || null]);

      const commandeId = result.insertId;

      for (let i = 0; i < lignes.length; i++) {
        const l = lignes[i];
        const totalLigne = l.quantite * l.prixUnitaire;
        await conn.execute(`
          INSERT INTO commande_lignes
            (commande_id, produit_id, designation, quantite, prix_unitaire, total_ligne, unite, ordre)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [commandeId, l.produitId || null, l.designation,
            l.quantite, l.prixUnitaire, totalLigne.toFixed(3),
            l.unite || 'unité', i]);
      }

      await conn.commit();
      return Commande.findById(commandeId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async update(id, data) {
    const { lignes = [], notes, tauxTva = 19 } = data;

    const totalHT  = lignes.reduce((s, l) => s + (l.quantite * l.prixUnitaire), 0);
    const totalTVA = totalHT * (tauxTva / 100);
    const totalTTC = totalHT + totalTVA;

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      await conn.execute(`
        UPDATE commandes
        SET taux_tva = ?, total_ht = ?, total_tva = ?, total_ttc = ?, notes = ?
        WHERE id = ? AND statut = 'brouillon'
      `, [tauxTva, totalHT.toFixed(3), totalTVA.toFixed(3),
          totalTTC.toFixed(3), notes || null, id]);

      await conn.execute(`DELETE FROM commande_lignes WHERE commande_id = ?`, [id]);

      for (let i = 0; i < lignes.length; i++) {
        const l = lignes[i];
        const totalLigne = l.quantite * l.prixUnitaire;
        await conn.execute(`
          INSERT INTO commande_lignes
            (commande_id, produit_id, designation, quantite, prix_unitaire, total_ligne, unite, ordre)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [id, l.produitId || null, l.designation,
            l.quantite, l.prixUnitaire, totalLigne.toFixed(3),
            l.unite || 'unité', i]);
      }

      await conn.commit();
      return Commande.findById(id);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // ── Envoyer la commande ───────────────────────────────────────────────────
  static async envoyer(id) {
    const commande = await Commande.findById(id);
    if (!commande) throw new Error('Commande introuvable');
    if (commande.statut !== 'brouillon') throw new Error('Seul un brouillon peut être envoyé');

    await db.execute(`
      UPDATE commandes SET statut = 'envoyee', date_envoi = NOW() WHERE id = ?
    `, [id]);

    return Commande.findById(id);
  }

  static async changerStatut(id, statut) {
    const STATUTS_VALIDES = ['brouillon', 'envoyee', 'confirmee', 'livree', 'annulee'];
    if (!STATUTS_VALIDES.includes(statut)) {
      throw new Error('Statut invalide');
    }
    await db.execute(`UPDATE commandes SET statut = ? WHERE id = ?`, [statut, id]);
    return Commande.findById(id);
  }

  static async delete(id) {
    const [result] = await db.execute(`DELETE FROM commandes WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  static format(row) {
    return {
      id:               row.id,
      fournisseurId:    row.fournisseur_id,
      fournisseurNom:   row.fournisseur_nom,
      fournisseurEmail: row.fournisseur_email,
      fournisseurTelephone: row.fournisseur_telephone,
      fournisseurAdresse:   row.fournisseur_adresse,
      
      reference:        row.reference,
      statut:           row.statut,
      tauxTva:          parseFloat(row.taux_tva),
      totalHT:          parseFloat(row.total_ht),
      totalTva:         parseFloat(row.total_tva),
      totalTTC:         parseFloat(row.total_ttc),
      notes:            row.notes,
      dateEnvoi:        row.date_envoi,
      lignesCount:      row.lignes_count || 0,
      createdAt:        row.created_at,
      updatedAt:        row.updated_at,
      lignes:           [],
    };
  }
}

module.exports = Commande;