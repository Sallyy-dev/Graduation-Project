const Coupon = require("../models/coupon");
const Cart = require("../models/cart");

/**
 * APPLY COUPON (USER)
 */
const applyCoupon = async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ message: "Coupon code is required" });
  }

  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    isActive: true,
    expiresAt: { $gt: new Date() },
  });

  if (!coupon) {
    return res.status(400).json({ message: "Invalid or expired coupon" });
  }

  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    return res.status(400).json({ message: "Coupon usage limit reached" });
  }

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  if (cart.totalPrice < coupon.minOrderAmount) {
    return res.status(400).json({
      message: `Minimum order amount is ${coupon.minOrderAmount}`,
    });
  }

  let discount = 0;

  if (coupon.discountType === "percentage") {
    discount = cart.totalPrice * (coupon.discountValue / 100);
  } else {
    discount = coupon.discountValue;
  }

  if (coupon.maxDiscount && discount > coupon.maxDiscount) {
    discount = coupon.maxDiscount;
  }

  const finalPrice = Math.max(cart.totalPrice - discount, 0);

  res.json({
    success: true,
    coupon: coupon.code,
    originalPrice: cart.totalPrice,
    discount,
    finalPrice,
  });
};

/**
 * CREATE COUPON (ADMIN)
 */
const createCoupon = async (req, res) => {
  const coupon = await Coupon.create(req.body);

  res.status(201).json({
    success: true,
    data: coupon,
  });
};

/**
 * GET ALL COUPONS (ADMIN)
 */
const getAllCoupons = async (req, res) => {
  const coupons = await Coupon.find().sort("-createdAt");

  res.json({
    success: true,
    count: coupons.length,
    data: coupons,
  });
};

/**
 * DISABLE COUPON (ADMIN)
 */
const toggleCouponStatus = async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    return res.status(404).json({ message: "Coupon not found" });
  }

  coupon.isActive = !coupon.isActive;
  await coupon.save();

  res.json({
    success: true,
    data: coupon,
  });
};

module.exports = {
  applyCoupon,
  createCoupon,
  getAllCoupons,
  toggleCouponStatus,
};
