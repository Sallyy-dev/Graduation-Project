const express = require("express");
const router = express.Router();

const {
  applyCoupon,
  createCoupon,
  getAllCoupons,
  toggleCouponStatus,
} = require("../controllers/coupon.controller");

const { authenticateToken } = require("../middlewares/auth");
const role = require("../middlewares/role");

// User
router.post("/apply", authenticateToken, applyCoupon);

// Admin
router.post("/", authenticateToken, role(["admin"]), createCoupon);
router.get("/", authenticateToken, role(["admin"]), getAllCoupons);
router.put(
  "/:id/toggle",
  authenticateToken,
  role(["admin"]),
  toggleCouponStatus
);

module.exports = router;
