// controllers/InventaireController.js
const db = require("../config/db");



const toMysqlDate = (d) => {
  if (!d) return null;
  return new Date(d).toISOString().split("T")[0]; // "YYYY-MM-DD"
};


// ── Auto-update retards ───────────────────────────────────────────────────────
const autoUpdateRetards = async (conn) => {
  const q = conn || db;
  await q.query(`
    UPDATE inventaire_lignes
    SET statut = 'en_retard'
    WHERE statut = 'en_cours' AND dateRetourPrevue < CURDATE()
  `);
  // Mettre à jour le statut global de la fiche si toutes les lignes sont en retard
  await q.query(`
    UPDATE inventaires i
    SET statut = 'en_retard'
    WHERE statut = 'en_cours'
      AND NOT EXISTS (
        SELECT 1 FROM inventaire_lignes l
        WHERE l.inventaireId = i.id AND l.statut = 'en_cours'
      )
      AND EXISTS (
        SELECT 1 FROM inventaire_lignes l
        WHERE l.inventaireId = i.id AND l.statut = 'en_retard'
      )
  `);
};

// ── GET /api/inventaires ──────────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    await autoUpdateRetards();
    const { statut, search } = req.query;

    let sql = `
      SELECT
        i.*,
        u.nom AS creeParNom,
        COUNT(l.id) AS nbLignes,
        SUM(l.quantite) AS totalUnites
      FROM inventaires i
      LEFT JOIN staff u ON u.id = i.creePar
      LEFT JOIN inventaire_lignes l ON l.inventaireId = i.id
      WHERE 1=1
    `;
    const params = [];

    if (statut) { sql += " AND i.statut = ?"; params.push(statut); }
    if (search) {
      sql += " AND (i.clientNom LIKE ? OR i.clientEmail LIKE ? OR i.clientTelephone LIKE ?)";
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    sql += " GROUP BY i.id ORDER BY i.createdAt DESC";

    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("[InventaireController.getAll]", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ── GET /api/inventaires/stats ────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    await autoUpdateRetards();
    const [[stats]] = await db.query(`
      SELECT
        COUNT(*)                          AS total,
        SUM(statut = 'en_cours')          AS en_cours,
        SUM(statut = 'en_retard')         AS en_retard,
        SUM(statut = 'rendu')             AS rendus,
        SUM(statut = 'annule')            AS annules
      FROM inventaires
    `);
    // Lignes en retard (matériels non rendus à temps)
    const [[{ lignesEnRetard }]] = await db.query(`
      SELECT COUNT(*) AS lignesEnRetard FROM inventaire_lignes WHERE statut = 'en_retard'
    `);
    res.json({ success: true, data: { ...stats, lignesEnRetard } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

exports.getById = async (req, res) => {
  try {
    const [fiches] = await db.query(`
      SELECT i.*, u.nom AS creeParNom
      FROM inventaires i
      LEFT JOIN staff u ON u.id = i.creePar
      WHERE i.id = ?
    `, [req.params.id]);

    if (!fiches.length) return res.status(404).json({ success: false, message: "Fiche introuvable" });

    const [lignes] = await db.query(`
      SELECT
        l.*,
        m.nom          AS materielNom,
        m.numeroSerie  AS materielNumeroSerie,
        m.reference    AS materielReference,
        m.statut       AS materielStatut,
        m.prixAchatHT  AS materielPrixAchatHT,
        m.caution      AS materielCaution
      FROM inventaire_lignes l
      LEFT JOIN materiels m ON m.id = l.materielId
      WHERE l.inventaireId = ?
      ORDER BY l.id ASC
    `, [req.params.id]);

    res.json({ success: true, data: { ...fiches[0], lignes } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ── POST /api/inventaires ─────────────────────────────────────────────────────
exports.create = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const {
      clientNom, clientTelephone, clientEmail,
      datePret, caution, commentaire, creePar,
      lignes // [{ materielId, quantite, dateRetourPrevue, prixLigne, commentaire }]
    } = req.body;

    if (!clientNom || !datePret || !lignes || !lignes.length) {
      return res.status(400).json({ success: false, message: "clientNom, datePret et au moins une ligne sont obligatoires" });
    }

    const parsedLignes = typeof lignes === "string" ? JSON.parse(lignes) : lignes;

    // Vérifier conflits : matériel déjà en prêt actif
    for (const ligne of parsedLignes) {
      const [[existing]] = await conn.query(
        `SELECT il.id FROM inventaire_lignes il
         JOIN inventaires i ON i.id = il.inventaireId
         WHERE il.materielId = ? AND il.statut IN ('en_cours','en_retard')`,
        [ligne.materielId]
      );
      if (existing) {
        await conn.rollback();
        return res.status(409).json({
          success: false,
          message: `Le matériel ID ${ligne.materielId} est déjà en cours de prêt`
        });
      }
    }

    // Calcul prix total
    const prixTotal = parsedLignes.reduce((sum, l) => sum + (parseFloat(l.prixLigne) || 0), 0);

    // Créer la fiche principale
    const [result] = await conn.query(`
      INSERT INTO inventaires
        (clientNom, clientTelephone, clientEmail, datePret,
         prixLocationTotal, caution, commentaire, creePar, statut)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'en_cours')
    `, [
      clientNom, clientTelephone || null, clientEmail || null,
      datePret, prixTotal || null, caution || null,
      commentaire || null, creePar || null
    ]);

    const inventaireId = result.insertId;

    // Insérer les lignes + mettre les matériels en location
    for (const ligne of parsedLignes) {
      await conn.query(`
        INSERT INTO inventaire_lignes
          (inventaireId, materielId, quantite, dateRetourPrevue, prixLigne, commentaire, statut)
        VALUES (?, ?, ?, ?, ?, ?, 'en_cours')
      `, [
        inventaireId,
        ligne.materielId,
        ligne.quantite || 1,
        ligne.dateRetourPrevue,
        ligne.prixLigne || null,
        ligne.commentaire || null
      ]);

      await conn.query(
        "UPDATE materiels SET statut = 'loue' WHERE id = ?",
        [ligne.materielId]
      );
    }

    await conn.commit();
    res.status(201).json({ success: true, data: { id: inventaireId } });
  } catch (err) {
    await conn.rollback();
    console.error("[InventaireController.create]", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  } finally {
    conn.release();
  }
};

// ── PUT /api/inventaires/:id ──────────────────────────────────────────────────
exports.update = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;
    const { clientNom, clientTelephone, clientEmail, commentaire, lignes } = req.body;

    // 1. Mise à jour des infos de la fiche
    await conn.query(`
      UPDATE inventaires SET
        clientNom = ?, clientTelephone = ?, clientEmail = ?, commentaire = ?
      WHERE id = ?
    `, [clientNom, clientTelephone || null, clientEmail || null, commentaire || null, id]);

    // 2. Synchronisation des lignes (diff insert / update / delete)
    if (Array.isArray(lignes)) {
      const [existingLignes] = await conn.query(
        `SELECT id FROM inventaire_lignes WHERE inventaireId = ?`,
        [id]
      );
      const existingIds = existingLignes.map(l => l.id);
      const incomingIds = lignes.filter(l => l.ligneId).map(l => l.ligneId);

      // 2a. Suppression des lignes retirées du formulaire
      const toDelete = existingIds.filter(eid => !incomingIds.includes(eid));
      if (toDelete.length > 0) {
        await conn.query(
          `DELETE FROM inventaire_lignes WHERE id IN (?)`,
          [toDelete]
        );
      }

      // 2b. Update ou Insert pour chaque ligne reçue
      for (const l of lignes) {
        const dateRetour = toMysqlDate(l.dateRetourPrevue);

        if (l.ligneId && existingIds.includes(l.ligneId)) {
          await conn.query(`
      UPDATE inventaire_lignes SET
        materielId = ?, quantite = ?, dateRetourPrevue = ?, commentaire = ?
      WHERE id = ?
    `, [l.materielId, l.quantite, dateRetour, l.commentaire || null, l.ligneId]);
        } else {
          await conn.query(`
      INSERT INTO inventaire_lignes
        (inventaireId, materielId, quantite, dateRetourPrevue, commentaire, statut)
      VALUES (?, ?, ?, ?, ?, 'en_cours')
    `, [id, l.materielId, l.quantite, dateRetour, l.commentaire || null]);
        }
      }
    }

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  } finally {
    conn.release();
  }
};

// ── POST /api/inventaires/lignes/:ligneId/retour ──────────────────────────────
// Retour d'une ligne (un matériel spécifique) indépendamment des autres
exports.marquerRetourLigne = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { ligneId } = req.params;
    const { dateRetourReelle } = req.body;

    const [[ligne]] = await conn.query(
      "SELECT * FROM inventaire_lignes WHERE id = ?", [ligneId]
    );
    if (!ligne) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "Ligne introuvable" });
    }

    const retour = dateRetourReelle || new Date().toISOString().split("T")[0];

    await conn.query(
      "UPDATE inventaire_lignes SET statut = 'rendu', dateRetourReelle = ? WHERE id = ?",
      [retour, ligneId]
    );

    // Remettre le matériel en stock
    await conn.query(
      "UPDATE materiels SET statut = 'en_stock' WHERE id = ?",
      [ligne.materielId]
    );

    // Vérifier si toutes les lignes de la fiche sont rendues → fermer la fiche
    const [[{ remaining }]] = await conn.query(
      `SELECT COUNT(*) AS remaining FROM inventaire_lignes
       WHERE inventaireId = ? AND statut IN ('en_cours','en_retard')`,
      [ligne.inventaireId]
    );

    if (remaining === 0) {
      await conn.query(
        "UPDATE inventaires SET statut = 'rendu' WHERE id = ?",
        [ligne.inventaireId]
      );
    }

    await conn.commit();
    res.json({ success: true, ficheTerminee: remaining === 0 });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: "Erreur serveur" });
  } finally {
    conn.release();
  }
};

// ── POST /api/inventaires/:id/retour-total ────────────────────────────────────
// Retour de tous les matériels d'un coup
exports.marquerRetourTotal = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { id } = req.params;
    const { dateRetourReelle } = req.body;
    const retour = dateRetourReelle || new Date().toISOString().split("T")[0];

    const [lignes] = await conn.query(
      "SELECT * FROM inventaire_lignes WHERE inventaireId = ? AND statut IN ('en_cours','en_retard')",
      [id]
    );

    for (const ligne of lignes) {
      await conn.query(
        "UPDATE inventaire_lignes SET statut = 'rendu', dateRetourReelle = ? WHERE id = ?",
        [retour, ligne.id]
      );
      await conn.query(
        "UPDATE materiels SET statut = 'en_stock' WHERE id = ?",
        [ligne.materielId]
      );
    }

    await conn.query(
      "UPDATE inventaires SET statut = 'rendu' WHERE id = ?", [id]
    );

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: "Erreur serveur" });
  } finally {
    conn.release();
  }
};

// ── DELETE /api/inventaires/:id ───────────────────────────────────────────────
exports.remove = async (req, res) => {
  try {
    const [[fiche]] = await db.query("SELECT statut FROM inventaires WHERE id = ?", [req.params.id]);
    if (!fiche) return res.status(404).json({ success: false, message: "Fiche introuvable" });
    if (fiche.statut === "en_cours" || fiche.statut === "en_retard") {
      return res.status(400).json({ success: false, message: "Impossible de supprimer un prêt actif" });
    }
    // CASCADE supprime les lignes automatiquement
    await db.query("DELETE FROM inventaires WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};