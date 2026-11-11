const express = require('express');
const router = express.Router();
const rondeController = require('../controllers/Rondecontroller');

// ⚠️ Ordre important (même règle que vos autres modules) :
// les routes fixes (/active/:veilleurId) doivent être déclarées
// AVANT la route générique /:id, sinon Express matche "active" comme un id.

router.post('/start', rondeController.startRonde);
router.put('/:id/end', rondeController.endRonde);
router.get('/active/:veilleurId', rondeController.getActiveRonde);
router.get('/', rondeController.listRondes);
router.get('/:id', rondeController.getRondeDetail);

module.exports = router;

// Dans votre app.js / index.js, monter avec :
// const rondeRoutes = require('./routes/rondeRoutes');
// app.use('/api/rondes', rondeRoutes);