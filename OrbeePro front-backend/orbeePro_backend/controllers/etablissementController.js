// controllers/etablissementController.js
const etablissementService = require('../Services/EtablissementService');

const etablissementController = {

  create: async (req, res) => {
    try {
      const etablissement = await etablissementService.create(req.body);
      
      res.status(201).json({
        success: true,
        message: "Établissement créé avec succès",
        data: etablissement
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la création de l'établissement",
        error: error.message
      });
    }
  },

  getAll: async (req, res) => {
    try {
      const etablissements = await etablissementService.findAll();
      res.status(200).json({
        success: true,
        data: etablissements
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  getById: async (req, res) => {
    try {
      const etablissement = await etablissementService.findById(req.params.id);
      if (!etablissement) {
        return res.status(404).json({
          success: false,
          message: "Établissement non trouvé"
        });
      }
      res.status(200).json({
        success: true,
        data: etablissement
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
};

module.exports = etablissementController;