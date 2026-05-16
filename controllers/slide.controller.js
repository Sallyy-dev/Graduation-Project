const Slide = require("../models/slide");

// Get All Slides
const getAllSlides = async (req, res) => {
  try {
    // Fetch all slides from database
    const slides = await Slide.find();

    // Return slides data with total count
    res.json({
      success: true,
      count: slides.length,
      data: slides,
    });
  } catch (error) {
    // Handle server errors
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create New Slide
const createSlide = async (req, res) => {
  try {
    // Extract slide data from request body
    const { title, description, image } = req.body;

    // Create new slide document
    const slide = new Slide({
      title,
      description,
      image,
    });

    // Save slide to database
    await slide.save();

    // Return success response
    res.status(201).json({
      success: true,
      data: slide,
    });
  } catch (error) {
    // Handle server errors
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllSlides,
  createSlide,
};
