
const QRCode = require('qrcode');
const db = require('../config/db');


// ─── Préfixes numérotation ────────────────────────────────────────────────────
const normalize = (s = '') =>
  s.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const PREFIX_MAP = {
  'etablissement': 'ETB', 'aile': 'AIL', 'zone vip': 'VIP',
  'espace public': 'PUB', 'chambre': 'CHB', 'suite': 'STE',
  'parking': 'PKG', 'cuisine': 'CUI', 'technique': 'TEC',
  'salle de reunion': 'SLL', 'salle de lavage': 'LAV', 'bureau': 'BUR',
  
};

// ─── GET : liste avec filtres ─────────────────────────────────────────────────
exports.getEspaces = async (req, res) => {
  try {
    const { parentId, niveau, statut, categorieId } = req.query;

    let where = 'WHERE 1=1';
    const params = [];

    if (niveau === 'racine') {
      where += ' AND e.parentId IS NULL';
    } else if (parentId !== undefined) {
      where += ' AND e.parentId = ?';
      params.push(Number(parentId));
    }

    if (statut)      { where += ' AND e.statut = ?';      params.push(statut); }
    if (categorieId) { where += ' AND e.categorieId = ?'; params.push(Number(categorieId)); }

    const [rows] = await db.query(`
      SELECT
        e.*,
        c.nom       AS categorieNom,
        c.icon      AS categorieIcon,
        c.couleur   AS categorieCouleur,
        p.nom       AS parentNom,
        p.type      AS parentType,
        (SELECT COUNT(*) FROM espace2 ch WHERE ch.parentId = e.id) AS nbEnfants
      FROM espace2 e
      LEFT JOIN categories c ON c.id = e.categorieId
      LEFT JOIN espace2 p    ON p.id = e.parentId
      ${where}
      ORDER BY e.created_at DESC
    `, params);

    // Parser les équipements JSON
    const result = rows.map(r => ({
      ...r,
      equipements: r.equipements
        ? (typeof r.equipements === 'string' ? JSON.parse(r.equipements) : r.equipements)
        : [],
    }));

    res.json(result);
  } catch (error) {
    console.error('getEspaces:', error);
    res.status(500).json({ message: error.message });
  }
};

// ─── GET : un espace + ses enfants directs ────────────────────────────────────
exports.getEspaceById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(`
      SELECT e.*, c.nom AS categorieNom, c.icon AS categorieIcon,
             c.couleur AS categorieCouleur, p.nom AS parentNom
      FROM espace2 e
      LEFT JOIN categories c ON c.id = e.categorieId
      LEFT JOIN espace2 p    ON p.id = e.parentId
      WHERE e.id = ?
    `, [id]);

    if (!rows.length) return res.status(404).json({ message: 'Espace non trouvé' });

    const [enfants] = await db.query(`
      SELECT e.*, c.nom AS categorieNom, c.icon AS categorieIcon,
             c.couleur AS categorieCouleur,
             (SELECT COUNT(*) FROM espace2 ch WHERE ch.parentId = e.id) AS nbEnfants
      FROM espace2 e
      LEFT JOIN categories c ON c.id = e.categorieId
      WHERE e.parentId = ?
      ORDER BY e.created_at DESC
    `, [id]);

    const espace = {
      ...rows[0],
      equipements: rows[0].equipements
        ? (typeof rows[0].equipements === 'string' ? JSON.parse(rows[0].equipements) : rows[0].equipements)
        : [],
      enfants: enfants.map(e => ({
        ...e,
        equipements: e.equipements
          ? (typeof e.equipements === 'string' ? JSON.parse(e.equipements) : e.equipements)
          : [],
      })),
    };

    res.json(espace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── POST : créer ─────────────────────────────────────────────────────────────
exports.createEspace = async (req, res) => {
  const {
    nom, categorieId, parentId,
    description, capacite, etage, zone,
    responsable, prix, superficie, statut, equipements,
  } = req.body;

  if (!nom?.trim())  return res.status(400).json({ message: 'Le nom est obligatoire' });
  if (!categorieId)  return res.status(400).json({ message: 'La catégorie est obligatoire' });

  try {
    // Récupérer la catégorie
    const [cats] = await db.query(
      'SELECT id, nom, icon, couleur FROM categories WHERE id = ?',
      [categorieId]
    );
    if (!cats.length) return res.status(400).json({ message: 'Catégorie introuvable' });

    const cat       = cats[0];
    const typeValue = cat.nom;
    const prefix    = PREFIX_MAP[normalize(cat.nom)] || 'ESP';
    const statutVal = statut || 'disponible';
    const equipStr  = Array.isArray(equipements) && equipements.length
      ? JSON.stringify(equipements) : null;

    // Insérer
    const [result] = await db.query(`
      INSERT INTO espace2
        (nom, type, categorieId, parentId, description, capacite, etage,
         zone, responsable, prix, superficie, statut, equipements)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      nom.trim(), typeValue, categorieId,
      parentId || null, description || null,
      capacite || null, etage || null, zone || null,
      responsable || null, prix || null, superficie || null,
      statutVal, equipStr,
    ]);

    const newId  = result.insertId;
    const numero = `${prefix}-${String(newId).padStart(4, '0')}`;
    const qrCode = await QRCode.toDataURL(numero, {
      width: 300, margin: 2,
      color: { dark: '#1a1a2e', light: '#FFFFFF' },
    });

    await db.query(
      'UPDATE espace2 SET numero=?, qrCode=? WHERE id=?',
      [numero, qrCode, newId]
    );

    return res.status(201).json({
      id: newId, nom: nom.trim(), type: typeValue,
      numero, qrCode, categorieId,
      categorieNom: cat.nom, categorieIcon: cat.icon,
      categorieCouleur: cat.couleur,
      statut: statutVal, parentId: parentId || null,
      message: 'Espace créé avec succès !',
    });

  } catch (error) {
    console.error('createEspace:', error);
    res.status(500).json({ message: error.message });
  }
};

// ─── PUT : mettre à jour ──────────────────────────────────────────────────────
exports.updateEspace = async (req, res) => {
  const { id } = req.params;
  const {
    nom, categorieId, description, capacite,
    etage, zone, responsable, prix, superficie, statut, equipements,
  } = req.body;

  try {
    const [cats] = await db.query('SELECT nom FROM categories WHERE id=?', [categorieId]);
    const typeValue = cats[0]?.nom || req.body.type;
    const equipStr  = Array.isArray(equipements) ? JSON.stringify(equipements) : null;

    await db.query(`
      UPDATE espace2 SET
        nom=?, type=?, categorieId=?, description=?, capacite=?, etage=?,
        zone=?, responsable=?, prix=?, superficie=?, statut=?, equipements=?,
        updated_at=NOW()
      WHERE id=?
    `, [
      nom, typeValue, categorieId, description || null,
      capacite || null, etage || null, zone || null,
      responsable || null, prix || null, superficie || null,
      statut || 'disponible', equipStr, id,
    ]);

    const [updated] = await db.query('SELECT * FROM espace2 WHERE id=?', [id]);
    res.json({ ...updated[0], message: 'Espace mis à jour !' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── PATCH : statut ───────────────────────────────────────────────────────────
exports.updateStatut = async (req, res) => {
  const VALIDES = ['disponible', 'occupé', 'maintenance', 'réservé'];
  const { statut } = req.body;
  if (!VALIDES.includes(statut))
    return res.status(400).json({ message: `Statut invalide. Valeurs : ${VALIDES.join(', ')}` });

  try {
    await db.query('UPDATE espace2 SET statut=?, updated_at=NOW() WHERE id=?', [statut, req.params.id]);
    res.json({ id: req.params.id, statut, message: 'Statut mis à jour !' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
exports.deleteEspace = async (req, res) => {
  try {
    const [enfants] = await db.query('SELECT id FROM espace2 WHERE parentId=?', [req.params.id]);
    if (enfants.length)
      return res.status(400).json({
        message: `Impossible : cet espace contient ${enfants.length} sous-espace(s). Supprimez-les d'abord.`
      });

    await db.query('DELETE FROM espace2 WHERE id=?', [req.params.id]);
    res.json({ message: 'Espace supprimé !' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET : arbre complet (récursif) ──────────────────────────────────────────
exports.getArbre = async (req, res) => {
  try {
    const [rows] = await db.query(`
      WITH RECURSIVE tree AS (
        SELECT e.*, 0 AS niveau
        FROM espace2 e WHERE e.parentId IS NULL
        UNION ALL
        SELECT e.*, t.niveau + 1
        FROM espace2 e JOIN tree t ON e.parentId = t.id
      )
      SELECT tree.*, c.nom AS categorieNom, c.icon AS categorieIcon, c.couleur AS categorieCouleur
      FROM tree
      LEFT JOIN categories c ON c.id = tree.categorieId
      ORDER BY tree.id
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};