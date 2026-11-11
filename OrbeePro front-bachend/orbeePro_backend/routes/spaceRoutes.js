const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/spaceController');
const auth=require('../middlewares/authmidelware');


console.log("Is auth defined?", typeof auth);
console.log("Is getEspaces defined?", typeof ctrl.getEspaces);
console.log("Is getArbre defined?", typeof ctrl.getArbre);



router.get('/',   auth,           ctrl.getEspaces);      // ?parentId=1 | ?niveau=racine
// router.get('/arbre',    auth,     ctrl.getArbre);         // arbre complet récursif
router.get('/:id',   auth,        ctrl.getEspaceById);    // détail + enfants
router.post('/',     auth,        ctrl.createEspace);     // créer
router.put('/:id',    auth,       ctrl.updateEspace);     // modifier
router.patch('/:id/statut',  auth,  ctrl.updateStatut);     // changer statut
router.delete('/:id',        auth,        ctrl.deleteEspace);     // supprimer

module.exports = router;