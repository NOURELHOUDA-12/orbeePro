const express = require('express');
const router = express.Router();
const commandeController = require('../controllers/commandeController');

router.get('/',             commandeController.getAll);
router.get('/:id',          commandeController.getOne);
router.post('/',            commandeController.create);
router.put('/:id',          commandeController.update);
router.post('/:id/envoyer', commandeController.envoyer);
router.post('/:id/statut',  commandeController.statut);
router.delete('/:id',       commandeController.delete);
router.get('/:id/imprimer', commandeController.imprimer);

module.exports = router;

