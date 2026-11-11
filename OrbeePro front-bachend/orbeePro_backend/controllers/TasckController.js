const db = require('../config/db');



// Récupérer toutes les données (Staff, Espaces, Tâches)
exports.getTaskManagerData = async (req, res) => {
    try {
        const [tasks] = await db.query(`
            SELECT t.*, s.nom as staffNom, s.prenom as staffPrenom, 
                   e.nom as espaceNom, 
                   parent.nom as parentNom
            FROM tasks t
            LEFT JOIN staff s ON t.staffId = s.id
            LEFT JOIN espace2 e ON t.espaceId = e.id
            LEFT JOIN espace2 parent ON e.parentId = parent.id
            ORDER BY t.createdAt DESC


            
        `);



        // ✅ Utiliser les méthodes locales (pas toISOString qui est UTC)
        const toLocalDateStr = (d) => {
            if (!d) return null;
            const date = new Date(d);
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        const formattedTasks = tasks.map(task => ({
            ...task,
            date:    toLocalDateStr(task.date),
            dateEnd: toLocalDateStr(task.dateEnd),
        }));

        const [staff] = await db.query('SELECT id, nom, prenom, role, profileImage as imageUrl FROM staff');
        const [espaces] = await db.query('SELECT * FROM espace2');
        
console.log(formattedTasks[0])

        // ✅ Envoyer formattedTasks et non tasks
        res.json({ tasks: formattedTasks, staff, espaces });

    } catch (err) {
        console.error("Erreur Controller GET:", err);
        res.status(500).json({ message: err.message });
    }
};


// Créer une tâche
exports.createTask = async (req, res) => {
  try {
    const {
      taskType,
      staffId,
      espaceId,
      startTime,
      notes,
      status,
      isRecurring,
      date,
      dateEnd,
      recurringType,
      recurringDays,
      recurringDayOfMonth,
      recurringMonthOfYear,
    } = req.body;

    // ✅ Fix timezone : extraire uniquement YYYY-MM-DD sans passer par new Date()
    const parseDate = (d) => {
      if (!d) return null;
      // Prend les 10 premiers caractères "YYYY-MM-DD" quelle que soit la forme reçue
      return d.toString().substring(0, 10);
    };

    const safeDate    = parseDate(date);
    const safeDateEnd = parseDate(dateEnd);

    const [result] = await db.query(
      `INSERT INTO tasks (
        taskType,
        staffId,
        espaceId,
        startTime,
        notes,
        status,
        isRecurring,
        date,
        dateEnd,
        recurringType,
        recurringDays,
        recurringDayOfMonth,
        recurringMonthOfYear,
        createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        taskType        || null,
        staffId         || null,
        espaceId        || null,
        startTime       || null,
        notes           || null,
        status          || "en attente",
        isRecurring     ?? 0,
        safeDate,        // ✅ "2026-05-13" pur, MySQL stocke exactement cette date
        safeDateEnd,     // ✅ idem
        recurringType        || null,
        recurringDays        || null,
        recurringDayOfMonth  || null,
        recurringMonthOfYear || null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Tâche créée avec succès",
      taskId: result.insertId,
    });

  } catch (error) {
    console.error("createTask error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Erreur serveur",
    });
  }
};


exports.getAllTasks = async (req, res) => {
    try {
        const query = `
            SELECT 
                t.*, 
                s.nom AS staffNom, 
                s.profileImage AS profileImage, 
                parent.nom          AS parentNom,

                e.nom AS espaceNom 

            FROM tasks t  
            LEFT JOIN staff s ON t.staffId = s.id
            LEFT JOIN espace2 e ON t.espaceId = e.id
            LEFT JOIN espace2 parent ON e.parentId = parent.id
            ORDER BY t.date DESC, t.startTime ASC
            
        `;
        
        const [results] = await db.query(query);

        return res.status(200).json({ 
            success: true, 
            tasks: results  
        });
        
    } catch (err) {
        console.error("Erreur SQL:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};


exports.updateTask = async (req, res) => {
    const { id } = req.params;
    const { taskType, startTime, notes, status, staffId, espaceId } = req.body;
    try {
        await db.query(
            'UPDATE tasks SET taskType=?, startTime=?, notes=?, status=?, staffId=?, espaceId=? WHERE id=?',
            [taskType, startTime, notes, status, staffId, espaceId, id]
        );
        res.json({ success: true, message: "Tâche mise à jour !" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};




exports.deleteTask = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM tasks WHERE id = ?', [id]);
    res.json({ success: true, message: "Mission supprimée" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



exports.updateStatus = async (req, res) => {
    try {
        const taskId = req.params.id;
        const newStatus = req.body.status;

        const [result] = await db.query(
            "UPDATE tasks SET status = ? WHERE id = ?",
            [newStatus, taskId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Tâche introuvable" });}

        return res.json({ success: true, message: "Statut mis à jour !" });

    } catch (err) {
        console.error("Erreur updateStatus:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};




 
exports.pauseTask = async (req, res) => {
    const taskId = req.params.id;
    const { reason } = req.body;


    try {
        // 1. Mise à jour du statut
        const sqlUpdate = "UPDATE tasks SET status = 'paused' WHERE id = ?";
        const [result] = await db.query(sqlUpdate, [taskId]);

        if (result.affectedRows === 0) {
            console.warn("⚠️ Aucune tâche trouvée avec l'ID:", taskId);
            return res.status(404).json({ success: false, message: "Tâche introuvable" });
        }


        // 2. Insertion du motif
        const sqlInsert = "INSERT INTO task_pauses (taskId, reason) VALUES (?, ?)";
        await db.query(sqlInsert, [taskId, reason || "Aucun motif"]);


        return res.json({ 
            success: true, 
            message: "Mission en pause et motif enregistré." 
        });

    }
     catch (error) {
        console.error("❌ ERREUR SQL:", error.message);
        return res.status(500).json({ 
            success: false, 
            message: "Erreur lors de la mise en pause",
            error: error.message 
        });
    }

};


exports.resumeTask = async (req, res) => {
    const taskId = req.params.id;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Remettre le statut de la tâche à 'in-progress'
        const sqlUpdateTask = "UPDATE tasks SET status = 'in-progress' WHERE id = ?";
        await connection.execute(sqlUpdateTask, [taskId]);

        // 2. Fermer la pause en cours (celle qui a pauseEnd à NULL)
        const sqlUpdatePause = `
            UPDATE task_pauses 
            SET pauseEnd = NOW() 
            WHERE taskId = ? AND pauseEnd IS NULL 
            ORDER BY pauseStart DESC 
            LIMIT 1
        `;
        await connection.execute(sqlUpdatePause, [taskId]);

        await connection.commit();
        res.json({ success: true, message: "Mission reprise." });

    } catch (error) {
        await connection.rollback();
        console.error("❌ Erreur lors du resume:", error.message);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        connection.release();
    }
};


exports.getTaskHistory = async (req, res) => {
    const taskId = req.params.id;

    try {
        // Vérifie bien les noms des colonnes ici (ex: taskId ou task_id ?)
        const sql = "SELECT * FROM task_pauses WHERE taskId = ? ORDER BY pauseStart DESC";
        
        const [history] = await db.query(sql, [taskId]);
        
        res.json({ success: true, history });

    } catch (error) {
        // C'EST ICI que l'erreur s'affiche dans ton terminal
        console.error("❌ ERREUR SQL HISTORY:", error.message);
        res.status(500).json({ 
            success: false, 
            message: "Erreur lors de la récupération de l'historique",
            error: error.message 
        });
    }
};

exports.getEmployeeTasks = async (req, res) => {
    const staffId = req.params.staffId;
    try {
        const [tasks] = await db.query(`
            SELECT t.*, s.nom as staffNom, s.prenom as staffPrenom, 
                   e.nom as espaceNom, se.nom as sousEspaceNom
            FROM tasks t
            LEFT JOIN staff s ON t.staffId = s.id
            LEFT JOIN espace2 e ON t.espaceId = e.id

            LEFT JOIN sous_espaces se ON t.sousEspaceId = se.id

            WHERE t.staffId = ?
            ORDER BY t.createdAt DESC`, 

            [staffId]);


               
        // ✅ Utiliser les méthodes locales (pas toISOString qui est UTC)
        
        const toLocalDateStr = (d) => {
            if (!d) return null;
            const date = new Date(d);
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        const formattedTasks = tasks.map(task => ({
            ...task,
            date:    toLocalDateStr(task.date),
            dateEnd: toLocalDateStr(task.dateEnd),
        }));

        const [staff] = await db.query('SELECT id, nom, prenom, role, profileImage as imageUrl FROM staff');
        const [espaces] = await db.query('SELECT * FROM espace2');

        const [sousEspaces] = await db.query('SELECT * FROM sous_espaces');
        
        console.log(formattedTasks[0])

        // ✅ Envoyer formattedTasks et non tasks
        res.json({ tasks: formattedTasks, staff, espaces, sousEspaces });

    } catch (err)
     {
        console.error("Erreur Controller GET:", err);
        res.status(500).json({ message: err.message });
    }
};


// GET /tasks/:id/pauses
exports.getPauses = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM task_pauses WHERE taskId = ? ORDER BY pauseStart DESC",
      [req.params.id]
    );
    res.json({ pauses: rows });
  } catch (err) {
    console.error("❌ Erreur getPauses:", err.message);
    res.status(500).json({ message: err.message });
  }
};



// POST /tasks/:id/pauses
exports.startPause = async (req, res) => {
  const { reason } = req.body;
  const taskId = req.params.id;

  try {
    await db.query(
      "INSERT INTO task_pauses (taskId, reason) VALUES (?, ?)",
      [taskId, reason || null]
    );

    await db.query(
      "UPDATE tasks SET status = 'en-pause' WHERE id = ?",
      [taskId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Erreur startPause:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// PATCH /tasks/:id/pauses/end
exports.endPause = async (req, res) => {
  try {
    await db.query(
      `UPDATE task_pauses 
       SET pauseEnd = NOW() 
       WHERE taskId = ? AND pauseEnd IS NULL 
       ORDER BY pauseStart DESC 
       LIMIT 1`,
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Erreur endPause:", err.message);
    res.status(500).json({ message: err.message });
  }
};