// routes/inventaireRoutes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/inventaireController");
const authMiddleware = require("../middlewares/authmidelware");

router.use(authMiddleware);

// Fixes avant /:id
router.get("/stats",                          ctrl.getStats);
router.get("/",                               ctrl.getAll);
router.post("/",                              ctrl.create);
router.get("/:id",                            ctrl.getById);
router.put("/:id",                            ctrl.update);
router.post("/:id/retour-total",              ctrl.marquerRetourTotal);
router.post("/lignes/:ligneId/retour",        ctrl.marquerRetourLigne);
router.delete("/:id",                         ctrl.remove);

module.exports = router;