const express = require('express');
const router = express.Router();
const reclamationController = require('../controllers/reclamationController');


const upload = require('../middlewares/uploads'); 
const auth=require('../middlewares/authmidelware');

//  #################
router.get('/', auth, reclamationController.getAllReclamations);


//__________________________________
router.post('/', auth, upload.single('reclamations'), reclamationController.createReclamation);
router.get('/getAllReclamations', auth, reclamationController.getAllReclamations);
router.get('/mes-reclamations',auth , reclamationController.getMyReclamations);
router.put('/:id/assign', auth, reclamationController.assignAgent);
// router.get('/staff/:userId', auth, reclamationController.getReclamationsByStaff);





router.get('/:userId', auth, reclamationController.getEmpReclamations);
router.get('/service/:role', auth, reclamationController.getReclamationsByService);
router.put('/updateStatus/:id', auth, reclamationController.updateStatus);
router.delete('/deleteReclamation/:id', auth, reclamationController.deleteReclamation);





module.exports = router;