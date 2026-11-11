


const router = require('express').Router();
const ctrl   = require('../controllers/devisController');
const auth   = require('../middlewares/authmidelware'); 

router.get('/',                    auth, ctrl.getAll);
router.get('/:id',                 auth, ctrl.getOne);
router.post('/',                   auth, ctrl.create);
router.put('/:id',                 auth, ctrl.update);
router.delete('/:id',              auth, ctrl.delete);
router.post('/:id/envoyer',        auth, ctrl.envoyer);       
router.post('/:id/statut',         auth, ctrl.changerStatut);  

module.exports = router;



