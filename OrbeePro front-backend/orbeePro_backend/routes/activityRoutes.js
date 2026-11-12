// routes/activityRoutes.js

const router = require('express').Router();
const db     = require('../config/db');      

router.get('/', async (req, res) => {          
  const { module, id } = req.query;            
                                               
  let query = `
    SELECT 
      al.*,
      CONCAT(u.prenom, ' ', u.nom) AS auteur
    FROM activity_logs al
    LEFT JOIN staff u ON u.id = al.fait_par
    WHERE 1=1
  `;
  const params = [];

  if (module) { query += ` AND al.module = ?`;    params.push(module); }
  if (id)     { query += ` AND al.module_id = ?`; params.push(id);     }

  query += ` ORDER BY al.created_at DESC LIMIT 500`;

  try {
    const [logs] = await db.query(query, params);
    res.json(logs);
  } catch (err) {
       console.error('❌ SQL Error:', err.message);  
    console.error('❌ SQL Code:', err.code);       
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;                       