const db = require('../config/db'); 

// --- POST /veilleur/position ---
// body: { veilleurId, latitude, longitude, rondeId? }
exports.enregistrerPosition = async (req, res) => {
  try {
    const { veilleurId, latitude, longitude, rondeId } = req.body;

    if (!veilleurId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'veilleurId, latitude et longitude requis' });
    }

    await db.query(
      `INSERT INTO veilleur_positions (veilleur_id, latitude, longitude, ronde_id, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [veilleurId, latitude, longitude, rondeId || null]
    );

    return res.status(201).json({ message: 'Position enregistrée' });
  } catch (err) {
    console.error('Erreur enregistrerPosition:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// --- GET /veilleur/position/dernier/:veilleurId ---
// Utile pour une carte admin "live" affichant la dernière position connue de chaque veilleur
exports.getDernierePosition = async (req, res) => {
  try {
    const { veilleurId } = req.params;
    const [rows] = await db.query(
      `SELECT * FROM veilleur_positions WHERE veilleur_id = ? ORDER BY created_at DESC LIMIT 1`,
      [veilleurId]
    );
    return res.json(rows[0] || null);
  } catch (err) {
    console.error('Erreur getDernierePosition:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};