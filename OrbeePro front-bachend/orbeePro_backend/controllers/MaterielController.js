// controllers/materiels.controller.js
const pool = require("../config/db");
const QRCode = require("qrcode");
const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (d) => (d ? new Date(d).toISOString().split("T")[0] : null);

const buildWhereClause = (filters) => {
  const conditions = [];
  const values = [];

  if (filters.search) {
    conditions.push("(m.nom LIKE ? OR m.reference LIKE ? OR m.numeroSerie LIKE ?)");
    const s = `%${filters.search}%`;
    values.push(s, s, s);
  }
  if (filters.etat)        { conditions.push("m.etat = ?");        values.push(filters.etat); }
  if (filters.statut)      { conditions.push("m.statut = ?");      values.push(filters.statut); }
  if (filters.criticite)   { conditions.push("m.criticite = ?");   values.push(filters.criticite); }
  if (filters.categorieId) { conditions.push("m.categorieId = ?"); values.push(filters.categorieId); }
  if (filters.espaceId)    { conditions.push("m.espaceId = ?");    values.push(filters.espaceId); }

  return {
    where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    values,
  };
};




const getMateriels = async (req, res) => {
  try {
    // 1. Exécution de la requête avec la structure existante
    const [rows] = await pool.query(`
      SELECT 
        m.id,
        m.nom,
        m.statut              AS status,
        m.prixAchatHT,
        m.photoURL        , 
        m.etat,
        m.emplacement,
        m.reference,
        m.numeroSerie,
        m.dateAchat,
        m.fournisseur,
        m.criticite,
        m.frequenceMaintenance,
        m.commentaire         ,
        m.accessoires,
        m.dateFinGarantie,m.prochainControle,m.dernierControle,m.dureeGarantie,
        m.creePar,
        m.caution,
        m.factureURL,
        
        c.nom                 AS categorie
      FROM materiels m
      LEFT JOIN categories c ON c.id = m.categorieId
      ORDER BY m.id DESC -- 💡 Optionnel : Affiche les plus récents en premier
    `);

    // 2. Formatage des données pour le Front-end (Sécurité JSON)
    const formattedRows = rows.map(item => {
      let parsedAccessoires = [];
      
      try {
        // Si c'est déjà un objet/tableau (cas de certains drivers MySQL avec le type JSON)
        if (Array.isArray(item.accessoires)) {
          parsedAccessoires = item.accessoires;
        } else if (item.accessoires) {
          // Si c'est une chaîne de caractères JSON, on la parse
          parsedAccessoires = JSON.parse(item.accessoires);
        }
      } catch (e) {
        // En cas de données mal formées en base, on évite le crash et on met un tableau vide
        parsedAccessoires = [];
      }

      return {
        ...item,
        accessoires: parsedAccessoires
      };
    });

    // 3. Réponse standardisée en cas de succès
    return res.status(200).json({ 
      success: true, 
      count: formattedRows.length, // Utile pour savoir combien d'éléments sont renvoyés
      data: formattedRows 
    });

  } catch (error) {
    // 4. Gestion des erreurs : Le serveur ne crashe pas, il répond proprement
    console.error("Erreur dans getMateriels :", error);
    
    return res.status(500).json({ 
      success: false, 
      message: "Une erreur interne est survenue lors de la récupération des matériels." 
    });
  }
};


      
// // ─── GET ALL ──────────────────────────────────────────────────────────────────
// const getMateriels2 = async (req, res) => {

//   console.log(req)

//   try {
//     const page  = parseInt(req.query.page)  || 1;
//     const limit = parseInt(req.query.limit) || 20;
//     const offset = (page - 1) * limit;

//     const { where, values } = buildWhereClause(req.query);

//     const [rows] = await pool.query(
//       `SELECT
//         m.*,
//         c.nom AS categorieNom
//        FROM materiels m
//        LEFT JOIN categories c ON c.id = m.categorieId
//        ${where}
//        ORDER BY m.created_at DESC
//        LIMIT ? OFFSET ?`,
//       [...values, limit, offset]
//     );

//     const [[{ total }]] = await pool.query(
//       `SELECT COUNT(*) AS total FROM materiels m ${where}`,
//       values
//     );

//     res.json({
//       success: true,
//       data: rows,
//       total,
//       page,
//       totalPages: Math.ceil(total / limit),
//     });
//   } catch (err) {
//     console.error("getMateriels:", err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// };

// ─── GET ONE ──────────────────────────────────────────────────────────────────
const getMaterielById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.*, 
      m.dateFinGarantie,m.prochainControle,m.dernierControle,m.dureeGarantie,
      
      
      c.nom AS categorieNom
       FROM materiels m
       LEFT JOIN categories c ON c.id = m.categorieId
       WHERE m.id = ?`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Matériel introuvable" });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("getMaterielById:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── CREATE ───────────────────────────────────────────────────────────────────
const createMateriel = async (req, res) => {

console.log("REQ BODY:", req.body);  
console.log("REQ FILES:", req.files);
  
const { nom, categorieId, dateAchat, creePar } = req.body;
console.log("Champs clés:", { nom, categorieId, dateAchat, creePar });

  try {
    const {
      nom,
      categorieId,
      reference,
      numeroSerie,
      dateAchat,
      prixAchatHT,
      fournisseur,
      dureeGarantie,
      etat,
      statut,
      emplacement,
      regleSortie,
      criticite,
      frequenceMaintenance,
      dernierControle,
      prochainControle,
      commentaire,
      accessoires,
      creePar,caution,
    } = req.body;

    // Validation champs obligatoires
    if (!nom || !categorieId || !dateAchat || !creePar) {
      return res.status(400).json({
        success: false,
        message: "Champs obligatoires manquants : nom, categorieId, dateAchat, creePar",
      });
    }

  
const photos = req.files?.photos || [];
const photoURL = photos.length > 0
  ? JSON.stringify(photos.map(f => `/uploads/materiels/${f.filename}`))
  : null;

    const factureURL = req.files?.facture?.[0]?.filename || null;

    // Génération du QR Code
    const tempRef = reference || `MAT-${Date.now()}`;
    const qrData  = JSON.stringify({ ref: tempRef, nom, dateAchat });
    const qrCode  = await QRCode.toDataURL(qrData);

    const [result] = await pool.query(
      `INSERT INTO materiels (
        nom, categorieId, reference, numeroSerie, qrCode,
        dateAchat, prixAchatHT, fournisseur, dureeGarantie,
        etat, statut, emplacement, regleSortie, criticite,
        frequenceMaintenance, dernierControle, prochainControle,
        commentaire, accessoires, photoURL, factureURL, creePar,caution
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`,
      
      [
        nom,
        categorieId,
        reference    || null,
        numeroSerie  || null,
        qrCode,
        formatDate(dateAchat),
        prixAchatHT  || null,
        fournisseur  || null,
        dureeGarantie ? parseInt(dureeGarantie) : null,
        etat         || "bon",
        statut       || "en_stock",
        emplacement  || null,
        regleSortie  || "pret_et_location",
        criticite    || "standard",
        frequenceMaintenance || "aucun",
        formatDate(dernierControle),
        formatDate(prochainControle),
        commentaire  || null,
        accessoires  ? (typeof accessoires === "string" ? accessoires : JSON.stringify(accessoires)) : null,
        photoURL,
        factureURL,
        creePar,
        caution,
      ]
    );

    // Log activité
    await pool.query(
      `INSERT INTO activity_logs (userId, action, targetType, targetId, details)
       VALUES (?, 'CREATE', 'materiel', ?, ?)`,
      [creePar, result.insertId, JSON.stringify({ nom })]
    ).catch(() => {}); // non bloquant

    res.status(201).json({
      success: true,
      message: "Matériel créé avec succès",
      id: result.insertId,
    });
  } catch (err) {
    console.error("createMateriel:", err);
    res.status(500).json({
      success: false,
      error: err.message,
      message: "Erreur lors de la création du matériel",
    });
  }
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────
const updateMateriel = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query("SELECT * FROM materiels WHERE id = ?", [id]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: "Matériel introuvable" });
    }

    const {
      nom, categorieId, reference, numeroSerie,
      dateAchat, prixAchatHT, fournisseur, dureeGarantie,
      etat, statut, emplacement, regleSortie, criticite,
      frequenceMaintenance, dernierControle, prochainControle,caution,
      commentaire, accessoires,
    } = req.body;

const photos = req.files?.photos || [];
const photoURL = photos.length > 0
  ? JSON.stringify(photos.map(f => `/uploads/materiels/${f.filename}`))
  : existing[0].photoURL;


    const factureURL = req.files?.facture?.[0]?.filename || existing[0].factureURL;

    await pool.query(
      `UPDATE materiels SET
        nom = ?, categorieId = ?, reference = ?, numeroSerie = ?,
        dateAchat = ?, prixAchatHT = ?, fournisseur = ?, dureeGarantie = ?,
        etat = ?, statut = ?, emplacement = ?, regleSortie = ?, criticite = ?,
        frequenceMaintenance = ?, dernierControle = ?, prochainControle = ?,
        commentaire = ?, accessoires = ?, photoURL = ?, factureURL = ?
       WHERE id = ?`,
      [
        nom          ?? existing[0].nom,
        categorieId  ?? existing[0].categorieId,
        reference    ?? existing[0].reference,
        numeroSerie  ?? existing[0].numeroSerie,
        formatDate(dateAchat) ?? existing[0].dateAchat,
        prixAchatHT  ?? existing[0].prixAchatHT,
        fournisseur  ?? existing[0].fournisseur,
        dureeGarantie ? parseInt(dureeGarantie) : existing[0].dureeGarantie,
        etat         ?? existing[0].etat,
        statut       ?? existing[0].statut,
        emplacement  ?? existing[0].emplacement,
        regleSortie  ?? existing[0].regleSortie,
        criticite    ?? existing[0].criticite,
        frequenceMaintenance ?? existing[0].frequenceMaintenance,
        formatDate(dernierControle) ?? existing[0].dernierControle,
        formatDate(prochainControle) ?? existing[0].prochainControle,
        commentaire  ?? existing[0].commentaire,
        accessoires  ? (typeof accessoires === "string" ? accessoires : JSON.stringify(accessoires)) : existing[0].accessoires,
        photoURL,
        factureURL,
        id,
      ]
    );

    res.json({ success: true, message: "Matériel mis à jour" });
  } catch (err) {
    console.error("updateMateriel:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
const deleteMateriel = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM materiels WHERE id = ?", [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Matériel introuvable" });
    }

    await pool.query("DELETE FROM materiels WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Matériel supprimé" });
  } catch (err) {
    console.error("deleteMateriel:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── STATS ────────────────────────────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const [[{ total }]] = await pool.query("SELECT COUNT(*) AS total FROM materiels");

    const [parEtat] = await pool.query(
      "SELECT etat, COUNT(*) AS count FROM materiels GROUP BY etat"
    );
    const [parStatut] = await pool.query(
      "SELECT statut, COUNT(*) AS count FROM materiels GROUP BY statut"
    );
    const [parCriticite] = await pool.query(
      "SELECT criticite, COUNT(*) AS count FROM materiels GROUP BY criticite"
    );
    const [[{ enMaintenance }]] = await pool.query(
      "SELECT COUNT(*) AS enMaintenance FROM materiels WHERE statut = 'en_maintenance'"
    );
    const [[{ garantiesExpirees }]] = await pool.query(
      "SELECT COUNT(*) AS garantiesExpirees FROM materiels WHERE dateFinGarantie < CURDATE()"
    );
    const [[{ controlesDus }]] = await pool.query(
      "SELECT COUNT(*) AS controlesDus FROM materiels WHERE prochainControle <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)"
    );

    const toMap = (rows) =>
      rows.reduce((acc, r) => ({ ...acc, [r.etat || r.statut || r.criticite]: r.count }), {});

    res.json({
      success: true,
      data: {
        total,
        parEtat:      toMap(parEtat),
        parStatut:    toMap(parStatut),
        parCriticite: toMap(parCriticite),
        enMaintenance,
        garantiesExpirees,
        controlesDus,
      },
    });
  } catch (err) {
    console.error("getStats:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── QR CODE ──────────────────────────────────────────────────────────────────
const getQrCode = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, nom, reference, qrCode FROM materiels WHERE id = ?",
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Matériel introuvable" });
    }

    // Régénérer si absent
    if (!rows[0].qrCode) {
      const qrData = JSON.stringify({ id: rows[0].id, ref: rows[0].reference, nom: rows[0].nom });
      const qrCode = await QRCode.toDataURL(qrData);
      await pool.query("UPDATE materiels SET qrCode = ? WHERE id = ?", [qrCode, req.params.id]);
      return res.json({ success: true, qrCode });
    }

    res.json({ success: true, qrCode: rows[0].qrCode });
  } catch (err) {
    console.error("getQrCode:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── EXPORT CSV ───────────────────────────────────────────────────────────────
const exportCsv = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.id, m.nom, m.reference, m.numeroSerie, c.nom AS categorie,
              m.etat, m.statut, m.emplacement, m.criticite,
              m.dateAchat, m.dateFinGarantie, m.prixAchatHT,
              m.fournisseur, m.frequenceMaintenance,
              m.dernierControle, m.prochainControle
       FROM materiels m
       LEFT JOIN categories c ON c.id = m.categorieId
       ORDER BY m.created_at DESC`
    );

    const headers = [
      "ID","Nom","Référence","N° Série","Catégorie","État","Statut",
      "Emplacement","Criticité","Date Achat","Fin Garantie",
      "Prix HT","Fournisseur","Fréq. Maintenance","Dernier Contrôle","Prochain Contrôle",
    ];

    const csv = [
      headers.join(";"),
      ...rows.map((r) =>
        [
          r.id, r.nom, r.reference || "", r.numeroSerie || "", r.categorie || "",
          r.etat, r.statut, r.emplacement || "", r.criticite,
          r.dateAchat || "", r.dateFinGarantie || "",
          r.prixAchatHT || "", r.fournisseur || "",
          r.frequenceMaintenance, r.dernierControle || "", r.prochainControle || "",
        ].join(";")
      ),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="materiels_${Date.now()}.csv"`);
    res.send("\uFEFF" + csv); // BOM pour Excel
  } catch (err) {
    console.error("exportCsv:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── EXPORT EXCEL ─────────────────────────────────────────────────────────────
const exportExcel = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.id, m.nom, m.reference, m.numeroSerie, c.nom AS categorie,
              m.etat, m.statut, m.emplacement, m.criticite,
              m.dateAchat, m.dateFinGarantie, m.prixAchatHT,
              m.fournisseur, m.frequenceMaintenance,
              m.dernierControle, m.prochainControle
       FROM materiels m
       LEFT JOIN categories c ON c.id = m.categorieId
       ORDER BY m.created_at DESC`
    );

    const workbook  = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Matériels");

    worksheet.columns = [
      { header: "ID",               key: "id",                   width: 8  },
      { header: "Nom",              key: "nom",                  width: 25 },
      { header: "Référence",        key: "reference",            width: 15 },
      { header: "N° Série",         key: "numeroSerie",          width: 15 },
      { header: "Catégorie",        key: "categorie",            width: 18 },
      { header: "État",             key: "etat",                 width: 12 },
      { header: "Statut",           key: "statut",               width: 15 },
      { header: "Emplacement",      key: "emplacement",          width: 20 },
      { header: "Criticité",        key: "criticite",            width: 12 },
      { header: "Date Achat",       key: "dateAchat",            width: 14 },
      { header: "Fin Garantie",     key: "dateFinGarantie",      width: 14 },
      { header: "Prix HT",          key: "prixAchatHT",          width: 12 },
      { header: "Fournisseur",      key: "fournisseur",          width: 20 },
      { header: "Fréq. Maintenance",key: "frequenceMaintenance", width: 18 },
      { header: "Dernier Contrôle", key: "dernierControle",      width: 16 },
      { header: "Prochain Contrôle",key: "prochainControle",     width: 16 },
    ];

    // Style header
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
      cell.alignment = { horizontal: "center" };
    });

    rows.forEach((r) => worksheet.addRow(r));

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="materiels_${Date.now()}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("exportExcel:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── MAINTENANCE ALERTS ───────────────────────────────────────────────────────
const getMaintenanceAlerts = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.*, c.nom AS categorieNom
       FROM materiels m
       LEFT JOIN categories c ON c.id = m.categorieId
       WHERE m.prochainControle <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
         AND m.statut NOT IN ('archive', 'hors_service')
       ORDER BY m.prochainControle ASC`
    );
    res.json({ success: true, data: rows, count: rows.length });
  } catch (err) {
    console.error("getMaintenanceAlerts:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── UPDATE CONTROLE ──────────────────────────────────────────────────────────
const updateControle = async (req, res) => {
  try {
    const { id } = req.params;
    const { dernierControle, prochainControle, commentaire } = req.body;

    if (!dernierControle || !prochainControle) {
      return res.status(400).json({
        success: false,
        message: "dernierControle et prochainControle sont obligatoires",
      });
    }

    await pool.query(
      `UPDATE materiels
       SET dernierControle = ?, prochainControle = ?, commentaire = IFNULL(?, commentaire)
       WHERE id = ?`,
      [formatDate(dernierControle), formatDate(prochainControle), commentaire || null, id]
    );

    res.json({ success: true, message: "Contrôle mis à jour" });
  } catch (err) {
    console.error("updateControle:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── UPDATE STATUT RAPIDE ─────────────────────────────────────────────────────
const updateStatut = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    const VALID_STATUTS = ["en_stock","prete","loue","en_retard","en_maintenance","hors_service","archive"];
    if (!VALID_STATUTS.includes(statut)) {
      return res.status(400).json({ success: false, message: "Statut invalide" });
    }

    await pool.query("UPDATE materiels SET statut = ? WHERE id = ?", [statut, id]);
    res.json({ success: true, message: "Statut mis à jour" });
  } catch (err) {
    console.error("updateStatut:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
  getMateriels,
  getMaterielById,
  createMateriel,
  updateMateriel,
  deleteMateriel,
  getStats,
  getQrCode,
  exportCsv,
  exportExcel,
  getMaintenanceAlerts,
  updateControle,
  updateStatut,
};