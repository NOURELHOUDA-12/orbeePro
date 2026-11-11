const express = require('express');
const router = express.Router();
const parkingController = require('./parkingController');
 
 
router.post('/', parkingController.enregistrerEntree);
router.put('/:id/sortie', parkingController.enregistrerSortie);
router.get('/actifs', parkingController.listActifs);
router.get('/', parkingController.listHistorique);
router.get('/:id', parkingController.getDetail);
 
module.exports = router;