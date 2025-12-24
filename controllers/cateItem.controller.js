const CateItem = require("../models/cateItem");
const APIFeatures = require("../utils/apiFeatures");

/**
 * GET ALL ITEMS
 * Filter - Search - Pagination
 */
const getAllCateItems = async (req, res) => {
  try {
    const features = new APIFeatures(
      CateItem.find({ isAvailable: true }).populate("category", "name"),
      req.query
    )
      .filter()
      .search()
      .paginate();

    const items = await features.query;

    res.json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET ITEM BY ID
 */
const getCateItemById = async (req, res) => {
  try {
    const item = await CateItem.findById(req.params.id).populate(
      "category",
      "name"
    );

    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * CREATE ITEM (ADMIN)
 */
const createCateItem = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      basePrice,
      sizes,
      images,
      stock,
      isBestSeller,
    } = req.body;

    const item = new CateItem({
      name,
      description,
      category,
      basePrice,
      sizes: sizes || [],
      images,
      stock: stock || 0,
      isBestSeller: isBestSeller || false,
    });

    const newItem = await item.save();

    res.status(201).json({
      success: true,
      message: "Item created successfully",
      data: newItem,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * UPDATE ITEM
 */
const updateCateItem = async (req, res) => {
  try {
    const updatedItem = await CateItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    res.json({ success: true, data: updatedItem });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * DELETE ITEM
 */
const deleteCateItem = async (req, res) => {
  try {
    const deletedItem = await CateItem.findByIdAndDelete(req.params.id);

    if (!deletedItem) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    res.json({
      success: true,
      message: "Item deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllCateItems,
  getCateItemById,
  createCateItem,
  updateCateItem,
  deleteCateItem,
};
