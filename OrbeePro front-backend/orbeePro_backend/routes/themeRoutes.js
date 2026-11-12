// routes/themeRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authmidelware'); // ton middleware JWT existant
const {
  createTheme, getMyThemes, updateTheme, deleteTheme,
} = require('../controllers/themeController');

router.get('/', auth, getMyThemes);
router.post('/', auth, createTheme);
router.put('/:id', auth, updateTheme);
router.delete('/:id', auth, deleteTheme);

module.exports = router;