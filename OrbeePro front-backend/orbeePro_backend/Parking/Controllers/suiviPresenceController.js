const db = require('../../config/db');
const { distanceMetres } = require('../../utils/haversine');

async function enregistrerPosition(req, res) {
  const { employeId, lat, lng } = req.body;
  if (!employeId || lat === undefined || lng === undefined) {
    return res.status(400).json({ message: 'employeId, lat et lng sont requis' });
  }

  try {
    const [[employe]] = await db.query(
      `SELECT u.id, z.centre_lat, z.centre_lng, z.rayon_metres
       FROM staff u
       LEFT JOIN zones_presence z ON z.id = u.zone_presence_id
       WHERE u.id = ?`,
      [employeId]



           
    );

    if (!employe) {
      return res.status(404).json({ message: 'Employé introuvable' });
    }

    let dansZone = true; // pas de zone assignée = pas de contrainte
    if (employe.centre_lat !== null) {
      const distance = distanceMetres(
        parseFloat(lat),
        parseFloat(lng),
        parseFloat(employe.centre_lat),
        parseFloat(employe.centre_lng)
      );
      dansZone = distance <= employe.rayon_metres;
    }

    await db.query(
      `INSERT INTO suivi_positions (employe_id, lat, lng, dans_zone) VALUES (?, ?, ?, ?)`,
      [employeId, lat, lng, dansZone]
    );

    await db.query(
      `INSERT INTO suivi_positions_live (employe_id, lat, lng, dans_zone)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE lat = VALUES(lat), lng = VALUES(lng),
         dans_zone = VALUES(dans_zone), updated_at = CURRENT_TIMESTAMP`,
      [employeId, lat, lng, dansZone]
    );

    res.json({ dansZone });
  } catch (e) {
    console.error('Erreur enregistrerPosition:', e);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

async function getPositionsActuelles(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT sp.employe_id, u.nom, u.prenom, sp.lat, sp.lng, sp.dans_zone, sp.updated_at
       FROM suivi_positions_live sp
       JOIN staff u ON u.id = sp.employe_id`
    );

    const positions = rows.map((r) => ({
      employeId: r.employe_id,
      nom: `${r.prenom} ${r.nom}`,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lng),
      dansZone: !!r.dans_zone,
      derniereMaj: r.updated_at,
    }));

    res.json(positions);
  } catch (e) {
    console.error('Erreur getPositionsActuelles:', e);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

module.exports = { enregistrerPosition, getPositionsActuelles };