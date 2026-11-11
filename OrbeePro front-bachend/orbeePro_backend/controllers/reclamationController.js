const db = require('../config/db');
const logActivity=require('./activityLog')



exports.createReclamation = async (req, res) => {
  try {
    const { espaceId, service, urgency, description } = req.body;
    const createdBy = req.user.id;
    const photoURL  = req.file ? req.file.filename : null;

    const sql = `
      INSERT INTO reclamations 
      (espaceId, service, urgency, description, photoURL, createdBy, status) 
      VALUES (?, ?, ?, ?, ?, ?, 'en attente')
    `;



    const [result] = await db.query(sql, [
      espaceId || null,
      service,
      urgency,
      description || null,
      photoURL,
      createdBy,
    ]);

    await logActivity({
      module   : 'reclamations',
      moduleId : result.insertId,
      action   : 'INSERT',
      faitPar  : createdBy,
      roleUser : '',
    });

    res.status(201).json({ 
      success: true, 
      message: "Réclamation créée avec succès",
      id: result.insertId,
    });

  } catch (error) {
    console.error("Erreur création réclamation:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllReclamations = async (req, res) => {
  try {
    const sql = `
      SELECT 
        r.*, 
        u1.nom              AS creatorName,
        u2.nom              AS agentName,
        e.nom               AS espaceName,
        e.numero            AS espaceNumero,
        e.categorieId       AS espaceCategorieId,
        c.nom               AS categorieNom,
        c.icon              AS categorieIcon,
        c.couleur           AS categorieCouleur,
        parent.nom          AS parentNom,
        parent.numero       AS parentNumero
      FROM reclamations r
      LEFT JOIN staff      u1     ON r.createdBy  = u1.id
      LEFT JOIN staff      u2     ON r.agentId    = u2.id
      LEFT JOIN espace2    e      ON r.espaceId   = e.id
      LEFT JOIN categories c      ON e.categorieId = c.id
      LEFT JOIN espace2    parent ON e.parentId   = parent.id
      ORDER BY r.createdAt DESC
    `;

    const [rows] = await db.query(sql);

    const data = rows.map(row => ({
  ...row,
  agentAssigne:  row.agentId ? { id: row.agentId, nom: row.agentName } : null,
  createdByInfo: row.createdBy ? { id: row.createdBy, nom: row.creatorName } : null,
  espace: row.espaceId ? {
    id:               row.espaceId,
    nom:              row.espaceName,
    numero:           row.espaceNumero,
    categorieNom:     row.categorieNom,
    categorieIcon:    row.categorieIcon,
    categorieCouleur: row.categorieCouleur,
    parentNom:        row.parentNom,
    parentNumero:     row.parentNumero,
  } : null,
}));

    res.json({ success: true, data });

console.log("Réclamations récupérées:", data.length);

  } catch (error) {
    console.error('Erreur récupération réclamations:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};



exports.getMyReclamations = async (req, res) => {
  try {
    const agentId = req.user.id; // extrait du JWT

    const sql = `
      SELECT 
        r.*, 
        u1.nom              AS creatorName,
        u2.nom              AS agentName,
        e.nom               AS espaceName,
        e.numero            AS espaceNumero,
        e.categorieId       AS espaceCategorieId,
        c.nom               AS categorieNom,
        c.icon              AS categorieIcon,
        c.couleur           AS categorieCouleur,
        parent.nom          AS parentNom,
        parent.numero       AS parentNumero
      FROM reclamations r
      LEFT JOIN staff      u1     ON r.createdBy  = u1.id
      LEFT JOIN staff      u2     ON r.agentId    = u2.id
      LEFT JOIN espace2    e      ON r.espaceId   = e.id
      LEFT JOIN categories c      ON e.categorieId = c.id
      LEFT JOIN espace2    parent ON e.parentId   = parent.id
      WHERE r.agentId = ?
      ORDER BY r.createdAt DESC
    `;

    const [rows] = await db.query(sql, [agentId]);

    const data = rows.map(row => ({
      ...row,
      agentAssigne:  row.agentId  ? { id: row.agentId,  nom: row.agentName  } : null,
      createdByInfo: row.createdBy ? { id: row.createdBy, nom: row.creatorName } : null,
      espace: row.espaceId ? {
        id:               row.espaceId,
        nom:              row.espaceName,
        numero:           row.espaceNumero,
        categorieNom:     row.categorieNom,
        categorieIcon:    row.categorieIcon,
        categorieCouleur: row.categorieCouleur,
        parentNom:        row.parentNom,
        parentNumero:     row.parentNumero,
      } : null,
    }));

    res.json({ success: true, data });

  } catch (error) {
    console.error('getMyReclamations:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};



exports.assignAgent = async (req, res) => {
    const { id } = req.params;
    const { agentId } = req.body;

    try {
        // On met à jour l'agentId ET on change le statut automatiquement
        const sql = "UPDATE reclamations SET agentId = ? WHERE id = ?";
        const [result] = await db.query(sql, [agentId, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Réclamation non trouvée" });
        }

        res.json({ success: true, message: "Assignation réussie" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }

},



exports.getAll = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM reclamations ORDER BY createdAt DESC");
        
        res.json({ 
            success: true, 
            data: rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};
 
 
 
 
  
  
   // j'utilise ses fonctions pour tester axios :
 
 
  
exports.getEmpReclamations = async (req, res) => {
    const { userId } = req.params;

    try {
        
        const sqlActive = `
            SELECT * from reclamations 
            where service=?
            ORDER BY createdAt DESC
        `;

       

        const [activeTasks] = await Promise.all([
            db.query(sqlActive, [userRole]),
        
        ]);

        res.json({
            success: true,
            data: {
                active: activeTasks[0], 
              
            }
        });




    } catch (error) {
        console.error("Erreur SQL Staff Tasks:", error);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
};



exports.getReclamationsByService = async (req, res) => {
    const { role } = req.params; // Récupère 'menager', 'plomberie', etc.
    try {
        // Requête pour les tâches actives du service
        const sqlActive = `
            SELECT * FROM reclamations 
            WHERE service = ? 
            ORDER BY createdAt DESC
        `;

        // Requête pour l'historique du service
        const sqlHistory = `
            SELECT * FROM reclamations 
            WHERE service = ? 
            ORDER BY updatedAt DESC 
        `;

        const [activeTasks, historyTasks] = await Promise.all([
            db.query(sqlActive, [role]),
            db.query(sqlHistory, [role])
        ]);

        res.json({
            success: true,
            data: {
                active: activeTasks[0],
                history: historyTasks[0]
            }

            
        });
    } catch (error) {
        console.error("Erreur Récupération par Service:", error);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
};

exports.pauseReclamation = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    try {
        await db.query("UPDATE reclamations SET status = 'paused' WHERE id = ?", [id]);
        
        await db.query(
            "INSERT INTO reclamation_pauses (reclamationId, reason, pausedAt) VALUES (?, ?, NOW())",
            [id, reason]
        );

        res.json({ success: true, message: "Réclamation mise en pause" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


exports.resumeReclamation = async (req, res) => {
    const { id } = req.params;

    try {
        await db.query("UPDATE reclamations SET status = 'en cours' WHERE id = ?", [id]);
        
        // 2. On met à jour la dernière pause active (celle qui n'a pas encore de resumedAt)
        await db.query(
            "UPDATE reclamation_pauses SET resumedAt = NOW() WHERE reclamationId = ? AND resumedAt IS NULL",
            [id]
        );

        res.json({ success: true, message: "Travail repris" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



exports.updateStatus = async (req, res) => {
  const { id } = req.params; // ID de la réclamation
  const { status, pauseReason, agentId } = req.body;
  
  const now = new Date();

  try {
    // 1. Préparation de la requête pour la table principale 'reclamations'
    let query = "UPDATE reclamations SET status = ?, updatedAt = ?";
    let params = [status, now];

    if (status === 'en cours') {
      // CAS : Premier démarrage OU Reprise après pause
      
      // A. On ferme la session de pause active dans 'reclamation_pauses'
      await db.query(
        "UPDATE reclamation_pauses SET resumedAt = ? WHERE reclamationId = ? AND resumedAt IS NULL",
        [now, id]
      );

      // B. On met à jour startedAt (seulement si c'est NULL) et l'agentId
      query += ", startedAt = IFNULL(startedAt, ?), agentId = IFNULL(agentId, ?)";
      params.push(now, agentId);
    } 
    
    else if (status === 'paused') {
      // CAS : Mise en pause
      
      // On crée une nouvelle ligne dans 'reclamation_pauses'
      await db.query(
        "INSERT INTO reclamation_pauses (reclamationId, reason, pausedAt) VALUES (?, ?, ?)",
        [id, pauseReason || "Aucun motif", now]
      );
      
      // Optionnel: on peut aussi stocker la raison actuelle dans la table principale pour un accès rapide
      query += ", currentPauseReason = ?";
      params.push(pauseReason);

      
                      
                      
    }
    
    else if (status === 'résolu') {
      // CAS : Finalisation
      query += ", completedAt = ?, resolvedBy = ?";
      params.push(now, agentId);
    }

    // Exécution de la mise à jour principale
    query += " WHERE id = ?";
    params.push(id);

    await db.query(query, params);

    res.json({ success: true, message: "Statut et chronomètre mis à jour" });

  } catch (error) {
    console.error("Erreur SQL:", error.message);
    res.status(500).json({ success: false, message: "Erreur lors de la mise à jour" });
  }
};




exports.deleteReclamation = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM reclamations WHERE id = ?", [id]);
        res.json({ message: "reclamation supprimé avec succès !" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

