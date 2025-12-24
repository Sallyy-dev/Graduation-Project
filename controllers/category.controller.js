const Category = require("../models/categories");
const CateItem = require("../models/cateItem");
const APIFeatures = require("../utils/apiFeatures");

/**
 * GET ALL CATEGORIES (ADMIN)
 */
const getAllCategories = async (req, res) => {
  try {
    const features = new APIFeatures(Category.find(), req.query)
      .filter()
      .search()
      .paginate();

    const categories = await features.query;

    res.json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCateTypes = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).select("name");
    const menuTypes = categories.map((c) => c.name);
    res.json({ success: true, data: menuTypes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getItemsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const category = await Category.findOne({ name: type, isActive: true });

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    const items = await CateItem.find({
      category: category._id,
      isActive: true,
    }).populate("category", "name");

    res.json({ success: true, type, count: items.length, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: "server error" });
  }
};

//  add new category
const addCategory = async (req, res) => {
  try {
    const { name, description, image } = req.body;
    const newCategory = new Category({ name, description, image });
    const savedCategory = await newCategory.save();
    res
      .status(201)
      .json({ success: true, message: "Category added", data: savedCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// updateCategory & deleteCategory currently not exposed via routes
// could be used later if admin edit/delete is needed

/**
 * UPDATE CATEGORY
 */
const updateCategory = async (req, res) => {
  try {
    const updated = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * DELETE CATEGORY
 */
const deleteCategory = async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllCategories,
  getCateTypes,
  getItemsByType,
  addCategory,
  deleteCategory,
  updateCategory,
};
