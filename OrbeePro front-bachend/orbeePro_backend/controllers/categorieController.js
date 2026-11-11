const db = require('../config/db');

// ── GET — toutes les catégories d'un module ───────────────────────────────────
exports.getByModule = async (req, res) => {

  const { module } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT * FROM categories
       WHERE module = ? AND actif = 1
       ORDER BY ordre ASC, nom ASC`,
      [module]
    );
    
    res.json({ success: true, data: rows });
    res.set('Content-Type', 'application/json; charset=utf-8');
    console.log(`✅ ${rows.length} catégories récupérées pour le module "${module}"`);
    console.log(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }

};

// ── GET — tous les modules distincts ─────────────────────────────────────────
exports.getModules = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT module, COUNT(*) AS total
       FROM categories GROUP BY module ORDER BY module ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};




// ── POST — créer ──────────────────────────────────────────────────────────────
exports.create = async (req, res) => {
  const { module, nom, icon, couleur, ordre } = req.body;
  if (!module || !nom) {
    return res.status(400).json({ success: false, message: 'Module et nom sont requis' });
  }

  try {
    // Ordre auto si non fourni
    const [maxOrdre] = await db.query(
      'SELECT MAX(ordre) AS maxOrdre FROM categories WHERE module = ?', [module]
    );
    const nextOrdre = ordre || (maxOrdre[0].maxOrdre || 0) + 1;

    const [result] = await db.query(
      `INSERT INTO categories (module, nom, icon, couleur, ordre)
       VALUES (?, ?, ?, ?, ?)`,
      [module, nom, icon || '📦', couleur || '#6B7280', nextOrdre]
    );
    const [created] = await db.query(
      'SELECT * FROM categories WHERE id = ?', [result.insertId]
    );
    res.status(201).json({ success: true, data: created[0] });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: `La catégorie "${nom}" existe déjà dans ce module`,
      });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};



// ── PUT — modifier ────────────────────────────────────────────────────────────
exports.update = async (req, res) => {
  const { id } = req.params;
  const { nom, icon, couleur, ordre, actif } = req.body;
  try {
    await db.query(
      `UPDATE categories SET
        nom     = COALESCE(?, nom),
        icon    = COALESCE(?, icon),
        couleur = COALESCE(?, couleur),
        ordre   = COALESCE(?, ordre),
        actif   = COALESCE(?, actif)
       WHERE id = ?`,
      [nom, icon, couleur, ordre, actif, id]
    );
    const [updated] = await db.query(
      'SELECT * FROM categories WHERE id = ?', [id]
    );
    res.json({ success: true, data: updated[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE — supprimer ────────────────────────────────────────────────────────
exports.remove = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ success: true, message: 'Catégorie supprimée' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT — réordonner (drag & drop) ────────────────────────────────────────────
exports.reorder = async (req, res) => {
  const { items } = req.body; // [{ id, ordre }]
  try {
    await Promise.all(
      items.map(({ id, ordre }) =>
        db.query('UPDATE categories SET ordre = ? WHERE id = ?', [ordre, id])
      )
    );
    res.json({ success: true, message: 'Ordre mis à jour' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};