

const router = require('express').Router();
const ctrl   = require('../controllers/categorieController');
const auth   = require('../middlewares/authmidelware');

router.get('/modules',         auth, ctrl.getModules);
router.get('/:module',         auth, ctrl.getByModule);  
router.post('/',               auth, ctrl.create);
router.put('/reorder',         auth, ctrl.reorder);
router.put('/:id',             auth, ctrl.update);
router.delete('/:id',          auth, ctrl.remove);

module.exports = router;