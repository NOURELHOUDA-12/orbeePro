const express = require('express');
const router = express.Router();
const {  enregistrerPosition,  getPositionsActuelles,} = require('../Controllers/suiviPresenceController');
const auth = require('../../middlewares/authmidelware'); 

router.get('/actuelles', auth, getPositionsActuelles);
router.post('/position', auth, enregistrerPosition);


module.exports = router;