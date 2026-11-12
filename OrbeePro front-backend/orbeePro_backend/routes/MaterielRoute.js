// routes/materiels.routes.js
const express = require("express");
const router  = express.Router();
const multer  = require("multer");
const path    = require("path");
const {
  getMateriels, getMaterielById, createMateriel, updateMateriel, deleteMateriel,
  getStats, getQrCode, exportCsv, exportExcel, getMaintenanceAlerts,
  updateControle, updateStatut,
} = require("../controllers/MaterielController");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.fieldname === "facture" ? "uploads/factures" : "uploads/materiels";
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|pdf/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  },
});

const uploadFields = upload.fields([
  { name: "facture", maxCount: 1 },
  { name: "photos",  maxCount: 5 },
]);



router.get("/stats",               getStats);
router.get("/export/csv",          exportCsv);
router.get("/export/excel",        exportExcel);
router.get("/maintenance/alerts",  getMaintenanceAlerts);

router.get("/",    getMateriels);
router.post("/",   uploadFields, createMateriel);

router.get("/:id",             getMaterielById);
router.put("/:id",             uploadFields, updateMateriel);
router.delete("/:id",          deleteMateriel);
router.get("/:id/qrcode",      getQrCode);
router.patch("/:id/controle",  updateControle);
router.patch("/:id/statut",    updateStatut);

module.exports = router;