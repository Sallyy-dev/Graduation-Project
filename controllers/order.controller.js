const Order = require("../models/order");
const CateItem = require("../models/cateItem");
const Cart = require("../models/cart");
const Coupon = require("../models/coupon");
const {
  authenticate,
  registerOrder,
  generatePaymentKey,
  iframeUrl
} = require("../utils/paymob"); 

/**
 * CREATE ORDER
 */
const createOrder = async (req, res) => {
  const userId = req.user.id;
  const { items, deliveryInfo, couponCode } = req.body;
  const { paymentMethod } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ message: "Items are required" });
  }

  if (
    !deliveryInfo ||
    !deliveryInfo.first_name ||
    !deliveryInfo.last_name ||
    !deliveryInfo.phone_number ||
    !deliveryInfo.address
  ) {
    return res.status(400).json({ message: "Delivery info incomplete" });
  }

  try {
    // get cart
    const cart = await Cart.findOne({ user: userId });

    if (!cart || !cart.items.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let totalPrice = 0;
    const orderItems = [];

    // 1️⃣ Calculate items
    for (const item of items) {
      const { cateItem, quantity, size } = item;

      const product = await CateItem.findById(cateItem);
      if (!product || !product.isAvailable) {
        return res.status(404).json({ message: "Product not available" });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          message: `Not enough stock for ${product.name}`,
        });
      }

      let finalItemPrice = product.basePrice;

      if (size) {
        const sizeObj = product.sizes.find((s) => s.size === size);
        if (sizeObj) finalItemPrice = sizeObj.price;
      }

      totalPrice += finalItemPrice * quantity;

      orderItems.push({
        cateItem: product._id,
        name: product.name,
        size,
        quantity,
        price: finalItemPrice,
      });

      product.stock -= quantity;
      await product.save();
    }

    // 2️⃣ Coupon logic
    let discount = 0;
    let couponData = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        expiresAt: { $gt: new Date() },
      });

      if (!coupon) {
        return res.status(400).json({ message: "Invalid coupon" });
      }

      if (coupon.minOrderAmount && totalPrice < coupon.minOrderAmount) {
        return res.status(400).json({
          message: `Minimum order amount is ${coupon.minOrderAmount}`,
        });
      }

      if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
        return res.status(400).json({ message: "Coupon usage limit reached" });
      }

      discount =
        coupon.discountType === "percentage"
          ? (totalPrice * coupon.discountValue) / 100
          : coupon.discountValue;

      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }

      coupon.usedCount += 1;
      await coupon.save();

      couponData = {
        code: coupon.code,
        discount,
      };
    }

    const finalPrice = Math.max(totalPrice - discount, 0);

    // 3️⃣ Create order
    const order = await Order.create({
      customer: req.user.id,
      items: orderItems,
      totalPrice,
      finalPrice,
      coupon: couponData,
      deliveryInfo,
      paymentMethod: paymentMethod,
      paymentStatus: "unpaid",
      currency: "EGP",
    });
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
/**
 * GET ALL ORDERS (ADMIN)
 */
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customer", "name email")
      .sort("-createdAt");

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET MY ORDERS (USER)
 */
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user.id }).sort(
      "-createdAt"
    );

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * UPDATE ORDER STATUS (ADMIN)
 */
const updateOrderStatus = async (req, res) => {
  const { status } = req.body;

  const validStatuses = [
    "pending",
    "preparing",
    "on-the-way",
    "delivered",
    "canceled",
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid order status" });
  }

  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      success: true,
      message: "Order status updated",
      data: order,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * CANCEL ORDER (USER / ADMIN)
 */
const cancelOrder = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const isOwner = order.customer.toString() === userId;
    const isAdmin = userRole === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (["delivered", "canceled"].includes(order.status)) {
      return res.status(400).json({ message: "Cannot cancel this order" });
    }

    order.status = "canceled";
    order.cancelledAt = new Date();
    order.cancelledBy = userId;

    await order.save();

    res.json({
      success: true,
      message: "Order canceled",
      data: order,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getMyOrders,
  updateOrderStatus,
  cancelOrder,
};
