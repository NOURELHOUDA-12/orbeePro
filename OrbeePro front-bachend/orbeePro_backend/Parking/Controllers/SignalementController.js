const db = require('../../config/db'); 


exports.creerSignalement = async (req, res) => {
  try {
    const { typeIncident, niveauUrgence, description, localisation, plaqueConcernee, veilleurId } = req.body;

    if (!typeIncident || !niveauUrgence || !description || !localisation || !veilleurId) {
      return res.status(400).json({
        message: 'typeIncident, niveauUrgence, description, localisation et veilleurId sont requis',
      });
    }

    const [result] = await db.query(
      `INSERT INTO signalements
        (type_incident, niveau_urgence, description, localisation, plaque_concernee, veilleur_id, statut)
       VALUES (?, ?, ?, ?, ?, ?, 'nouveau')`,
      [
        typeIncident,
        niveauUrgence,
        description,
        localisation,
        plaqueConcernee ? plaqueConcernee.toUpperCase().trim() : null,
        veilleurId,
      ]
    );

    const [rows] = await db.query(`SELECT * FROM signalements WHERE id = ?`, [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erreur creerSignalement:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// --- PUT /signalements/:id/statut ---
// body: { statut }
exports.updateStatut = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    if (!['nouveau', 'en_cours', 'resolu'].includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    await db.query(`UPDATE signalements SET statut = ? WHERE id = ?`, [statut, id]);

    const [rows] = await db.query(`SELECT * FROM signalements WHERE id = ?`, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Signalement introuvable' });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error('Erreur updateStatut:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// --- GET /signalements  (liste, filtrable) ---
// query: typeIncident?, niveauUrgence?, statut?, dateDebut?, dateFin?
exports.listSignalements = async (req, res) => {
  try {
    const { typeIncident, niveauUrgence, statut, dateDebut, dateFin } = req.query;
    let sql = `
      SELECT s.*, st.nom AS veilleur_nom
      FROM signalements s
      LEFT JOIN staff st ON st.id = s.veilleur_id
      WHERE 1 = 1
    `;
    const params = [];

    if (typeIncident) {
      sql += ' AND s.type_incident = ?';
      params.push(typeIncident);
    }
    if (niveauUrgence) {
      sql += ' AND s.niveau_urgence = ?';
      params.push(niveauUrgence);
    }
    if (statut) {
      sql += ' AND s.statut = ?';
      params.push(statut);
    }
    if (dateDebut) {
      sql += ' AND s.created_at >= ?';
      params.push(dateDebut);
    }
    if (dateFin) {
      sql += ' AND s.created_at <= ?';
      params.push(dateFin);
    }
    sql += ' ORDER BY FIELD(s.niveau_urgence, "urgent", "moyenne", "faible"), s.created_at DESC';

    const [rows] = await db.query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error('Erreur listSignalements:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// --- GET /signalements/:id ---
exports.getDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT s.*, st.nom AS veilleur_nom
       FROM signalements s LEFT JOIN staff st ON st.id = s.veilleur_id
       WHERE s.id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Signalement introuvable' });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error('Erreur getDetail:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};