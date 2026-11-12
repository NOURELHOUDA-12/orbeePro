const db = require('../config/db'); // adapter le chemin selon votre projet (mysql2/promise pool)

// --- POST /parking/entrees ---
// body: { plaque, typeVehicule, modeReglement, montant, heureDepartEstimee?, veilleurId, notes? }
exports.enregistrerEntree = async (req, res) => {
  try {
    const {
      plaque,
      typeVehicule,
      modeReglement,
      montant,
      heureDepartEstimee,
      veilleurId,
      notes,
    } = req.body;

    if (!plaque || !typeVehicule || !modeReglement || montant === undefined || !veilleurId) {
      return res.status(400).json({
        message: 'plaque, typeVehicule, modeReglement, montant et veilleurId sont requis',
      });
    }

    const [result] = await db.query(
      `INSERT INTO parking_entrees
        (plaque_immatriculation, type_vehicule, mode_reglement, montant,
         heure_entree, heure_depart_estimee, veilleur_id, notes, statut)
       VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, 'en_stationnement')`,
      [
        plaque.toUpperCase().trim(),
        typeVehicule,
        modeReglement,
        montant,
        heureDepartEstimee || null,
        veilleurId,
        notes || null,
      ]
    );

    const [rows] = await db.query(`SELECT * FROM parking_entrees WHERE id = ?`, [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erreur enregistrerEntree:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// --- PUT /parking/entrees/:id/sortie ---
exports.enregistrerSortie = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(`SELECT * FROM parking_entrees WHERE id = ?`, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Entrée introuvable' });
    }
    if (rows[0].statut === 'sorti') {
      return res.status(400).json({ message: 'Ce véhicule est déjà sorti' });
    }

    await db.query(
      `UPDATE parking_entrees SET statut = 'sorti', heure_sortie_reelle = NOW() WHERE id = ?`,
      [id]
    );

    const [updated] = await db.query(`SELECT * FROM parking_entrees WHERE id = ?`, [id]);
    return res.json(updated[0]);
  } catch (err) {
    console.error('Erreur enregistrerSortie:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// --- GET /parking/entrees/actifs ---
// IMPORTANT: cette route doit être déclarée AVANT /:id dans parkingRoutes.js
exports.listActifs = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, s.nom AS veilleur_nom
       FROM parking_entrees p
       LEFT JOIN staff s ON s.id = p.veilleur_id
       WHERE p.statut = 'en_stationnement'
       ORDER BY p.heure_entree DESC`
    );
    return res.json(rows);
  } catch (err) {
    console.error('Erreur listActifs:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// --- GET /parking/entrees  (historique, filtrable) ---
// query: plaque?, dateDebut?, dateFin?, statut?
exports.listHistorique = async (req, res) => {
  try {
    const { plaque, dateDebut, dateFin, statut } = req.query;
    let sql = `
      SELECT p.*, s.nom AS veilleur_nom
      FROM parking_entrees p
      LEFT JOIN staff s ON s.id = p.veilleur_id
      WHERE 1 = 1
    `;
    const params = [];

    if (plaque) {
      sql += ' AND p.plaque_immatriculation LIKE ?';
      params.push(`%${plaque.toUpperCase().trim()}%`);
    }
    if (statut) {
      sql += ' AND p.statut = ?';
      params.push(statut);
    }
    if (dateDebut) {
      sql += ' AND p.heure_entree >= ?';
      params.push(dateDebut);
    }
    if (dateFin) {
      sql += ' AND p.heure_entree <= ?';
      params.push(dateFin);
    }
    sql += ' ORDER BY p.heure_entree DESC';

    const [rows] = await db.query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error('Erreur listHistorique:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// --- GET /parking/entrees/:id ---
exports.getDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT p.*, s.nom AS veilleur_nom
       FROM parking_entrees p LEFT JOIN staff s ON s.id = p.veilleur_id
       WHERE p.id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Entrée introuvable' });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error('Erreur getDetail:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};