const db = require('../config/db'); 

// --- Helper : distance haversine entre deux points GPS (en mètres) ---
function distanceMetres(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
  
}

function distanceTotale(positions) {
  let total = 0;
  for (let i = 1; i < positions.length; i++) {
    total += distanceMetres(
      positions[i - 1].latitude,
      positions[i - 1].longitude,
      positions[i].latitude,
      positions[i].longitude
    );
  }
  return Math.round(total);
}

// --- POST /rondes/start ---
// body: { veilleurId }
exports.startRonde = async (req, res) => {
  try {
    const { veilleurId } = req.body;
    if (!veilleurId) {
      return res.status(400).json({ message: 'veilleurId requis' });
    }

    // Empêche de démarrer une 2e ronde si une est déjà en cours
    const [existantes] = await db.query(
      `SELECT id FROM rondes WHERE veilleur_id = ? AND statut = 'en_cours'`,
      [veilleurId]
    );
    if (existantes.length > 0) {
      return res.status(409).json({
        message: 'Une ronde est déjà en cours pour ce veilleur',
        ronde: existantes[0],
      });
    }

    const [result] = await db.query(
      `INSERT INTO rondes (veilleur_id, date_debut, statut) VALUES (?, NOW(), 'en_cours')`,
      [veilleurId]
    );

    const [rows] = await db.query(`SELECT * FROM rondes WHERE id = ?`, [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erreur startRonde:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// --- PUT /rondes/:id/end ---
exports.endRonde = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const [rondeRows] = await db.query(`SELECT * FROM rondes WHERE id = ?`, [id]);
    if (rondeRows.length === 0) {
      return res.status(404).json({ message: 'Ronde introuvable' });
    }
    const ronde = rondeRows[0];
    if (ronde.statut !== 'en_cours') {
      return res.status(400).json({ message: 'Cette ronde est déjà terminée ou annulée' });
    }

    // Toutes les positions envoyées pendant la ronde (tagguées côté GPS polling)
    const [positions] = await db.query(
      `SELECT latitude, longitude, created_at FROM veilleur_positions
       WHERE ronde_id = ? ORDER BY created_at ASC`,
      [id]
    );

    const distance = distanceTotale(positions);
    const dureeSecondes = Math.max(
      0,
      Math.round((Date.now() - new Date(ronde.date_debut).getTime()) / 1000)
    );

    await db.query(
      `UPDATE rondes
       SET statut = 'terminee', date_fin = NOW(), distance_totale_m = ?,
           duree_totale_s = ?, nb_positions = ?, notes = ?
       WHERE id = ?`,
      [distance, dureeSecondes, positions.length, notes || null, id]
    );

    const [updated] = await db.query(`SELECT * FROM rondes WHERE id = ?`, [id]);
    return res.json(updated[0]);
  } catch (err) {
    console.error('Erreur endRonde:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// --- GET /rondes/active/:veilleurId ---
// IMPORTANT: cette route doit être déclarée AVANT /:id dans rondeRoutes.js
exports.getActiveRonde = async (req, res) => {
  try {
    const { veilleurId } = req.params;
    const [rows] = await db.query(
      `SELECT * FROM rondes WHERE veilleur_id = ? AND statut = 'en_cours' LIMIT 1`,
      [veilleurId]
    );
    return res.json(rows[0] || null);
  } catch (err) {
    console.error('Erreur getActiveRonde:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// --- GET /rondes  (liste, filtrable) ---
// query: veilleurId?, dateDebut?, dateFin?
exports.listRondes = async (req, res) => {
  try {
    const { veilleurId, dateDebut, dateFin } = req.query;
    let sql = `
      SELECT r.*, s.nom AS veilleur_nom
      FROM rondes r
      LEFT JOIN staff s ON s.id = r.veilleur_id
      WHERE 1 = 1
    `;
    const params = [];

    if (veilleurId) {
      sql += ' AND r.veilleur_id = ?';
      params.push(veilleurId);
    }
    if (dateDebut) {
      sql += ' AND r.date_debut >= ?';
      params.push(dateDebut);
    }
    if (dateFin) {
      sql += ' AND r.date_debut <= ?';
      params.push(dateFin);
    }
    sql += ' ORDER BY r.date_debut DESC';

    const [rows] = await db.query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error('Erreur listRondes:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// --- GET /rondes/:id  (détail + trajet complet pour la carte) ---
exports.getRondeDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const [rondeRows] = await db.query(
      `SELECT r.*, s.nom AS veilleur_nom
       FROM rondes r LEFT JOIN staff s ON s.id = r.veilleur_id
       WHERE r.id = ?`,
      [id]
    );
    if (rondeRows.length === 0) {
      return res.status(404).json({ message: 'Ronde introuvable' });
    }

    const [positions] = await db.query(
      `SELECT latitude, longitude, created_at
       FROM veilleur_positions WHERE ronde_id = ? ORDER BY created_at ASC`,
      [id]
    );

    // mysql2 renvoie les colonnes DECIMAL sous forme de string : on force
    // la conversion en number, sinon react-native-maps peut planter nativement.
    const positionsNormalisees = positions.map((p) => ({
      ...p,
      latitude: parseFloat(p.latitude),
      longitude: parseFloat(p.longitude),
    }));

    return res.json({ ...rondeRows[0], positions: positionsNormalisees });
  } catch (err) {
    console.error('Erreur getRondeDetail:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};