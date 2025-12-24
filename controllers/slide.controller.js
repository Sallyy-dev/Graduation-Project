const Slide = require("../models/slide");

const getAllSlides = async (req, res) => {
  try {
    const slides = await Slide.find();
    res.json({ success: true, count: slides.length, data: slides });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createSlide = async (req, res) => {
  try {
    const { title, description, image } = req.body;
    const slide = new Slide({ title, description, image });
    await slide.save();
    res.status(201).json({ success: true, data: slide });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllSlides, createSlide };
