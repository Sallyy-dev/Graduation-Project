const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/auth");
const {
  getMyCart,
  addToCart,
  removeFromCart,
} = require("../controllers/cart.controller");

router.get("/", authenticateToken, getMyCart);
router.post("/add", authenticateToken, addToCart);
router.delete("/remove/:itemId", authenticateToken, removeFromCart);

module.exports = router;
