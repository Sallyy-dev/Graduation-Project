const express = require("express");
const router = express.Router();
const {
  getAllSlides,
  createSlide,
} = require("../controllers/slide.controller");

router.get("/", getAllSlides);
router.post("/", createSlide);

module.exports = router;
