const Cart = require("../models/cart");
const CateItem = require("../models/cateItem");

/**
 * GET MY CART
 */
const getMyCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product",
      "name images"
    );

    return res.json({
      success: true,
      data: cart || { items: [], totalPrice: 0 },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ADD TO CART
 */
const addToCart = async (req, res) => {
  try {
    const { productId, quantity, size } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "ProductId and valid quantity are required",
      });
    }

    const product = await CateItem.findById(productId);
    if (!product || !product.isAvailable) {
      return res.status(404).json({
        success: false,
        message: "Product not available",
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: "Not enough stock available",
      });
    }

    // Calculate price (base or size price)
    let price = product.basePrice;
    if (size) {
      const sizeObj = product.sizes.find((s) => s.size === size);
      if (!sizeObj) {
        return res.status(400).json({
          success: false,
          message: "Invalid size",
        });
      }
      price = sizeObj.price;
    }

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [], totalPrice: 0 });
    }

    const itemIndex = cart.items.findIndex(
      (i) => i.product.toString() === productId && i.size === size
    );

    if (itemIndex > -1) {
      const newQuantity = cart.items[itemIndex].quantity + quantity;

      if (product.stock < newQuantity) {
        return res.status(400).json({
          success: false,
          message: "Quantity exceeds available stock",
        });
      }

      cart.items[itemIndex].quantity = newQuantity;
    } else {
      cart.items.push({
        product: productId,
        size,
        quantity,
        price,
      });
    }

    // Recalculate total price
    cart.totalPrice = cart.items.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );

    await cart.save();

    res.json({
      success: true,
      message: "Item added to cart",
      data: cart,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * REMOVE ITEM FROM CART
 */
const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const itemExists = cart.items.some((i) => i._id.toString() === itemId);

    if (!itemExists) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    cart.items = cart.items.filter((i) => i._id.toString() !== itemId);

    cart.totalPrice = cart.items.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );

    await cart.save();

    res.json({
      success: true,
      message: "Item removed from cart",
      data: cart,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyCart,
  addToCart,
  removeFromCart,
};
