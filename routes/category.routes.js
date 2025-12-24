const express = require("express");
const router = express.Router();
const {
  getCateTypes,
  getItemsByType,
  addCategory,
  getAllCategories,
} = require("../controllers/category.controller");

const { authenticateToken } = require("../middlewares/auth");
const role = require("../middlewares/role");

router.get("/types", getCateTypes);
router.get("/:type/items", getItemsByType);

// Admin
router.post("/", authenticateToken, role(["admin"]), addCategory);
router.get("/", authenticateToken, role(["admin"]), getAllCategories);

module.exports = router;
