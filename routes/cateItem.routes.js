const express = require("express");
const router = express.Router();
const {
  getAllCateItems,
  getCateItemById,
  createCateItem,
  updateCateItem,
  deleteCateItem,
} = require("../controllers/cateItem.controller");

const { authenticateToken } = require("../middlewares/auth");
const role = require("../middlewares/role");

// Public
router.get("/", getAllCateItems);
router.get("/:id", getCateItemById);

//  Admin
router.post("/", authenticateToken, role(["admin"]), createCateItem);
router.put("/:id", authenticateToken, role(["admin"]), updateCateItem);
router.delete("/:id", authenticateToken, role(["admin"]), deleteCateItem);

module.exports = router;
