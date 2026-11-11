const Fournisseur = require('../Models/Fournisseur');

const fournisseurController = {

  getAll: async (req, res) => {
    console.log("eeeeeeeeeeeeeeeeeeeeeeee")
    try {
      const { search, categorie, actif } = req.query;
      const items = await Fournisseur.findAll({
        search,
        categorie,
        actif: actif !== undefined ? actif === 'true' : undefined,
      });
      res.json({ success: true, data: items, total: items.length });
      console.log('getAll fournisseurs:', items.length, 'fournisseurs trouvés');
      console.log(items)
    } catch (err) {
      console.error('getAll fournisseurs:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  getOne: async (req, res) => {
    try {
      const item = await Fournisseur.findById(req.params.id);
      Cconsole.log(item)
      if (!item) return res.status(404).json({ success: false, message: 'Fournisseur introuvable' });
      res.json({ success: true, data: item });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  create: async (req, res) => {
    console.log(req.body)
    try {
      const { nom, email, telephone,num_representant, adresse, categorie_id, actif } = req.body;
      if (!nom || !email || !categorie_id) {
        return res.status(400).json({ success: false, message: 'Nom, email et catégorie sont requis' });
      }
      const item = await Fournisseur.create({ nom, email, telephone,num_representant, adresse, categorie_id, actif });
      res.status(201).json({ success: true, data: item, message: 'Fournisseur créé avec succès' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: 'Cet email est déjà utilisé' });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  },

  update: async (req, res) => {
    try {
      const { nom, email, telephone,num_representant, adresse, categorie, actif } = req.body;
      const item = await Fournisseur.update(req.params.id, { nom, email, telephone,num_representant, adresse, categorie, actif });
      if (!item) return res.status(404).json({ success: false, message: 'Fournisseur introuvable' });
      res.json({ success: true, data: item, message: 'Fournisseur modifié avec succès' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  delete: async (req, res) => {
    try {
      const ok = await Fournisseur.delete(req.params.id);
      if (!ok) return res.status(404).json({ success: false, message: 'Fournisseur introuvable' });
      res.json({ success: true, message: 'Fournisseur supprimé avec succès' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = fournisseurController;