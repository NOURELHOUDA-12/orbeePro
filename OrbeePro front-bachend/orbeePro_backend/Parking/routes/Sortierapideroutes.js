// routes/sortieRapideRoutes.js
const express = require("express");
const router = express.Router();

const {
  createSortieRapide,
  getSortiesRapides,
} = require("../Controllers/SortieRapideController");
const uploadSortieRapide = require("../../middlewares/uploads");
const authMiddleware = require("../../middlewares/authmidelware"); 

router.get("/", authMiddleware, getSortiesRapides);

router.post("/",authMiddleware,  uploadSortieRapide.single("sorties-rapides"),  createSortieRapide);



module.exports = router;