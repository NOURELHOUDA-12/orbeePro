const express = require('express');
const router = express.Router();
const signalementController = require('../Controllers/SignalementController');
 
router.post('/', signalementController.creerSignalement);
router.put('/:id/statut', signalementController.updateStatut);
router.get('/', signalementController.listSignalements);
router.get('/:id', signalementController.getDetail);
 
module.exports = router;
 