const db = require("../../config/db"); 

const RAISONS_VALIDES = ["refus_paiement", "refus_place", "autre"];



const createSortieRapide = async (req, res) => {
  try {
    const { plaque, raison, commentaire, horodatage, } = req.body;

    // agent_id vient TOUJOURS du token JWT, jamais du body envoyé par le
    // client, pour éviter qu'un agent enregistre une sortie au nom d'un autre.
    const agentId = req.user?.id;

    if (!agentId) {
      return res.status(401).json({ message: "Agent non authentifié" });
    }

    if (!plaque || !plaque.trim()) {
      return res.status(400).json({ message: "La plaque est obligatoire" });
    }

    if (!RAISONS_VALIDES.includes(raison)) {
      return res.status(400).json({ message: "Raison invalide" });
    }

    if (raison === "autre" && (!commentaire || !commentaire.trim())) {
      return res
        .status(400)
        .json({ message: "Un commentaire est requis pour la raison 'Autre'" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Une photo est obligatoire" });
    }

    // Horodatage : on privilégie celui envoyé par le client (moment exact
    // de la validation côté app), mais on retombe sur l'heure serveur si
    // absent ou mal formé, pour ne jamais avoir de ligne sans horodatage.
    const horodatageFinal =
      horodatage && !isNaN(Date.parse(horodatage))
        ? new Date(horodatage)
        : new Date();

    const photoUrl = `/uploads/sorties-rapides/${req.file.filename}`;

    const [result] = await db.query(
      `INSERT INTO sorties_rapides
        (plaque, raison, commentaire, photo_url, horodatage, agent_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        plaque.trim().toUpperCase(),
        raison,
        raison === "autre" ? commentaire.trim() : null,
        photoUrl,
        horodatageFinal,
        agentId,
      ],
    );

    return res.status(201).json({
      message: "Sortie rapide enregistrée",
      id: result.insertId,
      photoUrl,
      horodatage: horodatageFinal,
    });
  } catch (error) {
    console.error("Erreur createSortieRapide:", error);
    return res.status(500).json({ message: "Erreur serveur lors de l'enregistrement" });
  }
};

// ─── Lister les sorties rapides (lecture seule, pour historique/reporting) ──
const getSortiesRapides = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT sr.*, s.nom AS agent_nom, s.prenom AS agent_prenom
       FROM sorties_rapides sr
       LEFT JOIN staff s ON s.id = sr.agent_id
       ORDER BY sr.horodatage DESC
       LIMIT 200`,
    );
    return res.json(rows);
  } catch (error) {
    console.error("Erreur getSortiesRapides:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

module.exports = {
  createSortieRapide,
  getSortiesRapides,
};