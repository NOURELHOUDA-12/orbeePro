// routes/etablissementRoutes.js
const express = require('express');
const router = express.Router();
const etablissementController = require('../controllers/etablissementController');

// Créer un établissement
router.post('/', etablissementController.create);

// Récupérer tous les établissements
router.get('/', etablissementController.getAll);

// Récupérer un établissement par ID
router.get('/:id', etablissementController.getById);

module.exports = router;