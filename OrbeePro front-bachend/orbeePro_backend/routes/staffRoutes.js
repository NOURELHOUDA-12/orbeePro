const express = require('express');
const router  = express.Router();
const staffController = require('../controllers/staffController');
const auth    = require('../middlewares/authmidelware');
const upload  = require('../middlewares/uploads');


router.get('/getAll',        auth, staffController.getAllStaff);
router.get('/staff',         auth, staffController.getAgents);
router.post('/AddNewStaff', auth,upload.single('staff'), staffController.addNewStaff);
router.get('/validate/:token', staffController.validateAccount);  

// router.put('/:id',     auth, upload.single('profileImages'), staffController.putStaff);
router.put('/:id', auth, upload.single('staff'), staffController.updateStaffById);

router.delete('/:id',  auth, staffController.deleteStaff);


router.get('/:userId',       auth, staffController.getUserById);

module.exports = router;