const db = require('../config/db');

class Produit {

  static async findAll({ fournisseurId, search, categorie, actif } = {}) {
    let sql = `
      SELECT p.*, f.nom AS fournisseur_nom
      FROM produits p
      LEFT JOIN fournisseurs f ON f.id = p.fournisseur_id
      WHERE 1=1
    `;
    const params = [];

    if (fournisseurId) {
      sql += ` AND p.fournisseur_id = ?`;
      params.push(fournisseurId);
    }
    if (search) {
      sql += ` AND (p.nom LIKE ? OR p.reference LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s);
    }
    if (categorie) {
      sql += ` AND p.categorie = ?`;
      params.push(categorie);
    }
    if (actif !== undefined) {
      sql += ` AND p.actif = ?`;
      params.push(actif ? 1 : 0);
    }

    sql += ` ORDER BY p.nom ASC`;
    const [rows] = await db.execute(sql, params);
    return rows.map(Produit.format);
  }

  static async findById(id) {
    const [rows] = await db.execute(`
      SELECT p.*, f.nom AS fournisseur_nom
      FROM produits p
      LEFT JOIN fournisseurs f ON f.id = p.fournisseur_id
      WHERE p.id = ?
    `, [id]);
    return rows[0] ? Produit.format(rows[0]) : null;
  }

static async create({ fournisseurId, nom, description, prix, unite, categorie, reference, stock, photo, actif = true }) {
  const [result] = await db.execute(`
    INSERT INTO produits
      (fournisseur_id, nom, description, prix, unite, categorie, reference, stock, photo, actif)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [fournisseurId, nom, description || null, prix, unite || 'unité',
      categorie || null, reference || null, stock || 0, photo || null, actif ? 1 : 0]);
  return Produit.findById(result.insertId);
}

static async update(id, data) {
  const { nom, description, prix, unite, categorie, reference, stock, actif, photo } = data;
  // Si pas de nouvelle photo envoyée, on ne touche pas à la colonne existante
  if (photo) {
    await db.execute(`
      UPDATE produits
      SET nom=?, description=?, prix=?, unite=?, categorie=?, reference=?, stock=?, actif=?, photo=?
      WHERE id=?
    `, [nom, description || null, prix, unite || 'unité', categorie || null,
        reference || null, stock || 0, actif ? 1 : 0, photo, id]);
  } else {
    await db.execute(`
      UPDATE produits
      SET nom=?, description=?, prix=?, unite=?, categorie=?, reference=?, stock=?, actif=?
      WHERE id=?
    `, [nom, description || null, prix, unite || 'unité', categorie || null,
        reference || null, stock || 0, actif ? 1 : 0, id]);
  }
  return Produit.findById(id);
}
  static async delete(id) {
    const [result] = await db.execute(`DELETE FROM produits WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  static format(row) {
    return {
      id:              row.id,
      fournisseurId:   row.fournisseur_id,
      fournisseurNom:  row.fournisseur_nom,
      nom:             row.nom,
      description:     row.description,
      prix:            parseFloat(row.prix),
      unite:           row.unite,
      categorie:       row.categorie,
      reference:       row.reference,
      stock:           row.stock,
      photo:           row.photo,
      actif:           row.actif === 1,
      createdAt:       row.created_at,
      updatedAt:       row.updated_at,
    };
  }
}

module.exports = Produit;