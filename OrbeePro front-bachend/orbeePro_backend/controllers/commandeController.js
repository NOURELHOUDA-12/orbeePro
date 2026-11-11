const Commande = require('../Models/Commande');
const { generateCommandePDF } = require('../Services/PdfService');

const commandeController = {

  getAll: async (req, res) => {
    try {
      const { fournisseurId, statut } = req.query;
      const items = await Commande.findAll({
        fournisseurId: fournisseurId ? parseInt(fournisseurId) : undefined,
        statut,
      });
      res.json({ success: true, data: items, total: items.length });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  getOne: async (req, res) => {
    try {
      const item = await Commande.findById(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: 'Commande introuvable' });
      res.json({ success: true, data: item });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  create: async (req, res) => {
    try {
      const { fournisseurId, lignes, notes, tauxTva } = req.body;

      if (!fournisseurId || !Array.isArray(lignes) || lignes.length === 0) {
        return res.status(400).json({ success: false, message: 'Fournisseur et lignes requis' });
      }

      const item = await Commande.create({ fournisseurId, lignes, notes, tauxTva });
      res.status(201).json({ success: true, data: item, message: 'Commande créée avec succès' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  update: async (req, res) => {
    try {
      const { lignes, notes, tauxTva } = req.body;

      if (!Array.isArray(lignes) || lignes.length === 0) {
        return res.status(400).json({ success: false, message: 'Lignes requises' });
      }

      const item = await Commande.update(req.params.id, { lignes, notes, tauxTva });
      if (!item) return res.status(404).json({ success: false, message: 'Commande introuvable' });
      res.json({ success: true, data: item, message: 'Commande modifiée avec succès' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  envoyer: async (req, res) => {
    try {
      const item = await Commande.envoyer(req.params.id);
      res.json({ success: true, data: item, message: 'Commande envoyée avec succès' });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  statut: async (req, res) => {
    try {
      const { statut } = req.body;
      const item = await Commande.changerStatut(req.params.id, statut);
      res.json({ success: true, data: item, message: 'Statut mis à jour' });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  delete: async (req, res) => {
    try {
      const ok = await Commande.delete(req.params.id);
      if (!ok) return res.status(404).json({ success: false, message: 'Commande introuvable' });
      res.json({ success: true, message: 'Commande supprimée avec succès' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },


// dans commandeController :
imprimer: async (req, res) => {
  try {
    const commande = await Commande.findById(req.params.id);
    if (!commande) {
      return res.status(404).json({ success: false, message: 'Commande introuvable' });
    }
    generateCommandePDF(commande, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
},
};

module.exports = commandeController;