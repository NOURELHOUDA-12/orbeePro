const Produit  = require('../Models/Produit');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');


// ── Upload photo produit ──────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/produits';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `produit_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits:    { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    /^image\//.test(file.mimetype) ? cb(null, true) : cb(new Error('Image uniquement'));
  },
});

const produitController = {

  upload: upload.single('photo'),

  getAll: async (req, res) => {
    try {
      const { fournisseurId, search, categorie, actif } = req.query;
      const items = await Produit.findAll({
        fournisseurId: fournisseurId ? parseInt(fournisseurId) : undefined,
        search,
        categorie,
        actif: actif !== undefined ? actif === 'true' : undefined,
      });
      res.json({ success: true, data: items, total: items.length });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  getOne: async (req, res) => {
    try {
      const item = await Produit.findById(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: 'Produit introuvable' });
      res.json({ success: true, data: item });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
create: async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.photo = `/uploads/produits/${req.file.filename}`;
    data.prix  = parseFloat(data.prix)  || 0;
    data.stock = parseInt(data.stock)   || 0;
    data.actif = data.actif === '1' || data.actif === true; // ✅ fix
    const item = await Produit.create(data);
    res.status(201).json({ success: true, data: item, message: 'Produit créé avec succès' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
},

  update: async (req, res) => {
    try {
      const data = { ...req.body };
      if (req.file) data.photo = `/uploads/produits/${req.file.filename}`;
      data.prix  = parseFloat(data.prix)  || 0;
      data.stock = parseInt(data.stock)   || 0;
      const item = await Produit.update(req.params.id, data);
      if (!item) return res.status(404).json({ success: false, message: 'Produit introuvable' });
      res.json({ success: true, data: item, message: 'Produit modifié avec succès' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  delete: async (req, res) => {
    try {
      const ok = await Produit.delete(req.params.id);
      if (!ok) return res.status(404).json({ success: false, message: 'Produit introuvable' });
      res.json({ success: true, message: 'Produit supprimé avec succès' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = produitController;