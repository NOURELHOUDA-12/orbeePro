const router = require('express').Router();
const ctrl   = require('../controllers/produitController');
const auth   = require('../middlewares/authmidelware'); 

router.get('/',       auth, ctrl.getAll);
router.get('/:id',    auth, ctrl.getOne);
router.post('/',      auth, ctrl.upload, ctrl.create);
router.put('/:id',    auth, ctrl.upload, ctrl.update);
router.delete('/:id', auth, ctrl.delete);

module.exports = router;