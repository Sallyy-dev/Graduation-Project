const express = require("express");
const router = express.Router();

const {
  createOrder,
  getAllOrders,
  getMyOrders,
  updateOrderStatus,
  cancelOrder,
} = require("../controllers/order.controller");

const { authenticateToken } = require("../middlewares/auth");
const role = require("../middlewares/role");

// User
router.post("/", authenticateToken, role(["user"]), createOrder);
router.get("/my-orders", authenticateToken, role(["user"]), getMyOrders);
router.put("/:id/cancel", authenticateToken, cancelOrder);

// Admin
router.get("/", authenticateToken, role(["admin"]), getAllOrders);
router.put(
  "/:id/status",
  authenticateToken,
  role(["admin"]),
  updateOrderStatus
);

module.exports = router;
