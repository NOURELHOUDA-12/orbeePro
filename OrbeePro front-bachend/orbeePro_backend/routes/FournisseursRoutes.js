const router = require('express').Router();
const ctrl   = require('../controllers/FournisseursController');
const verifyToken = require('../middlewares/authmidelware'); 
const auth = verifyToken; // Alias pour plus de clarté
router.get('/', ctrl.getAll);
router.get('/:id',   auth, ctrl.getOne);
router.post('/',     auth, ctrl.create);
router.put('/:id',   auth, ctrl.update);
router.delete('/:id',auth, ctrl.delete);

module.exports = router;