const db = require('../config/db');

// Helper pour capturer les erreurs de doublons (MySQL 1062)
const handleSqlError = (err, res) => {
  if (err.errno === 1062 || err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({ message: 'Vous possédez déjà un thème avec ce nom.' });
  }
  console.error(err);
  return res.status(500).json({ message: 'Erreur serveur.' });
};

exports.createTheme = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, emoji, baseColors, colors } = req.body;

    if (!name || !baseColors || !colors) {
      return res.status(400).json({ message: 'Champs manquants.' });
    }

    const [result] = await db.query(
      `INSERT INTO user_themes (userId, name, emoji, baseColors, colors) VALUES (?, ?, ?, ?, ?)`,
      [userId, name, emoji || '🎨', JSON.stringify(baseColors), JSON.stringify(colors)]
    );

    res.status(201).json({
      id: result.insertId,
      userId, name, emoji: emoji || '🎨', baseColors, colors,
    });
  } catch (err) {
    return handleSqlError(err, res);
  }
};

exports.getMyThemes = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      `SELECT * FROM user_themes WHERE userId = ? ORDER BY createdAt DESC`,
      [userId]
    );
    
    // Sécurité au cas où le driver ne parse pas le JSON automatiquement
    const themes = rows.map(r => ({
      ...r,
      baseColors: typeof r.baseColors === 'string' ? JSON.parse(r.baseColors) : r.baseColors,
      colors: typeof r.colors === 'string' ? JSON.parse(r.colors) : r.colors,
    }));
    
    res.json(themes);
  } catch (err) {
    console.error('getMyThemes error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.updateTheme = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    // 1. Récupérer d'abord le thème existant pour gérer le mode "patch" (mise à jour partielle)
    const [existing] = await db.query(
      `SELECT * FROM user_themes WHERE id = ? AND userId = ?`,
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Thème non trouvé.' });
    }

    const currentTheme = existing[0];

    // 2. Si un champ n'est pas fourni dans req.body, on garde l'ancienne valeur
    const name = req.body.name !== undefined ? req.body.name : currentTheme.name;
    const emoji = req.body.emoji !== undefined ? req.body.emoji : currentTheme.emoji;
    
    const baseColors = req.body.baseColors !== undefined 
      ? JSON.stringify(req.body.baseColors) 
      : (typeof currentTheme.baseColors === 'string' ? currentTheme.baseColors : JSON.stringify(currentTheme.baseColors));
      
    const colors = req.body.colors !== undefined 
      ? JSON.stringify(req.body.colors) 
      : (typeof currentTheme.colors === 'string' ? currentTheme.colors : JSON.stringify(currentTheme.colors));

    // 3. Exécuter la mise à jour
    await db.query(
      `UPDATE user_themes SET name = ?, emoji = ?, baseColors = ?, colors = ? WHERE id = ? AND userId = ?`,
      [name, emoji, baseColors, colors, id, userId]
    );

    res.json({ 
      message: 'Thème mis à jour avec succès.',
      theme: { id, userId, name, emoji, baseColors: JSON.parse(baseColors), colors: JSON.parse(colors) }
    });

  } catch (err) {
    return handleSqlError(err, res);
  }
};

exports.deleteTheme = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const [result] = await db.query(
      `DELETE FROM user_themes WHERE id = ? AND userId = ?`,
      [id, userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Thème non trouvé.' });
    }
    res.json({ message: 'Thème supprimé.' });
  } catch (err) {
    console.error('deleteTheme error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};