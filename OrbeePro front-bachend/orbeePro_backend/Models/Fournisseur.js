const db = require('../config/db');

class Fournisseur {

  // ── Tous les fournisseurs avec compteurs ──────────────────────────────────
  static async findAll({ search, categorie_id, actif } = {}) {
  try {
    console.log('🔍 findAll appelé avec:', { search, categorie_id, actif });

    let sql = `
      SELECT
        f.*,
        COUNT(DISTINCT p.id) AS produits_count,
        COUNT(DISTINCT d.id) AS devis_count
      FROM fournisseurs f
      LEFT JOIN produits p ON p.fournisseur_id = f.id AND p.actif = 1
      LEFT JOIN devis    d ON d.fournisseur_id = f.id
      WHERE 1=1
      GROUP BY f.id ORDER BY f.nom ASC
    `;

    console.log('📝 SQL:', sql);

    const [rows] = await db.execute(sql, []);

    console.log('✅ Rows count:', rows.length);
    console.log('✅ Premier row:', JSON.stringify(rows[0]));

    const formatted = rows.map(Fournisseur.format);
    console.log('✅ Formatted count:', formatted.length);
    console.log('✅ Premier formatted:', JSON.stringify(formatted[0]));

    return formatted;

  } catch (err) {
    console.error('❌ findAll SQL error:', err.message);
    console.error('❌ SQL State:', err.sqlState);
    console.error('❌ SQL Message:', err.sqlMessage);
    throw err;
  }
}
  // ── Un fournisseur par ID ─────────────────────────────────────────────────
  static async findById(id) {
    const [rows] = await db.execute(`
      SELECT
        f.*,
        COUNT(DISTINCT p.id) AS produits_count,
        COUNT(DISTINCT d.id) AS devis_count
      FROM fournisseurs f
      LEFT JOIN produits p ON p.fournisseur_id = f.id
      LEFT JOIN devis    d ON d.fournisseur_id = f.id
      WHERE f.id = ?
      GROUP BY f.id
    `, [id]);

    return rows[0] ? Fournisseur.format(rows[0]) : null;
  }

  // ── Créer ─────────────────────────────────────────────────────────────────
  static async create({ nom, email, telephone,num_representant, adresse, categorie_id, actif = true }) {
    const [result] = await db.execute(`
      INSERT INTO fournisseurs (nom, email, telephone,num_representant, adresse, categorie_id, actif)
      VALUES (?, ?, ?, ?, ?, ?,?)
    `, [nom, email, telephone ,num_representant|| null, adresse || null, categorie_id, actif ? 1 : 0]);

    return Fournisseur.findById(result.insertId);
  }

  // ── Mettre à jour ─────────────────────────────────────────────────────────
  static async update(id, { nom, email, telephone,num_representant, adresse, categorie_id, actif }) {
    await db.execute(`
      UPDATE fournisseurs
      SET nom = ?, email = ?, telephone = ?,num_representant= ? ,
          adresse = ?, categorie_id = ?, actif = ?
      WHERE id = ?
    `, [nom, email, telephone,num_representant || null, adresse || null, categorie_id, actif ? 1 : 0, id]);

    return Fournisseur.findById(id);
  }

  // ── Supprimer ─────────────────────────────────────────────────────────────
  static async delete(id) {
    const [result] = await db.execute(
      `DELETE FROM fournisseurs WHERE id = ?`, [id]
    );
    return result.affectedRows > 0;
  }

  // ── Format réponse ────────────────────────────────────────────────────────
  static format(row) {
    return {

      id:        row.id,
      nom:       row.nom,
      email:     row.email,
      telephone: row.telephone,
      num_representant:row.num_representant,
      adresse:   row.adresse,
      categorie_id: row.categorie_id,
      actif:     row.actif === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      _count: {
        produits: row.produits_count || 0,
        devis:    row.devis_count    || 0,
      },

    };
  }
}

module.exports = Fournisseur;