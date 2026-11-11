const express = require('express');
const router = express.Router();
const controller = require('../controllers/Veilleurpositioncontroller');

router.post('/position', controller.enregistrerPosition);
router.get('/position/dernier/:veilleurId', controller.getDernierePosition);





        
module.exports = router;


