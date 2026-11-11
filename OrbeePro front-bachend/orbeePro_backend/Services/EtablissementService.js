const db = require('../config/db'); 

const etablissementService = {
  
  /**
   * Créer un nouvel établissement
   */
  async create(data) {
    const {
      nom,
      type,
      adresse,
      telephone,
      email,
      icon,
      qr_data,
      description,
      superficie,
      statut = 'actif'
    } = data;

    const sql = `
      INSERT INTO etablissements 
      (nom, type, adresse, telephone, email, icon, qr_data, description, superficie, statut)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      nom,
      type,
      adresse || null,
      telephone || null,
      email || null,
      icon || 'building-2',
      qr_data || null,
      description || null,
      superficie || null,
      statut
    ];

    const [result] = await db.execute(sql, values);
    
    // Récupérer l'établissement créé
    const [etablissement] = await db.execute(
      'SELECT * FROM etablissements WHERE id = ?',
      [result.insertId]
    );

    return etablissement[0];
  },

  /**
   * Récupérer tous les établissements
   */
  async findAll() {
    const [rows] = await db.execute('SELECT * FROM etablissements ORDER BY created_at DESC');
    return rows;
  },

  /**
   * Récupérer un établissement par ID
   */
  async findById(id) {
    const [rows] = await db.execute('SELECT * FROM etablissements WHERE id = ?', [id]);
    return rows[0];
  }
};

module.exports = etablissementService;