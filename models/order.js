const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [
      {
        cateItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "CateItem",
          required: true,
        },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        size: {
          type: String,
          enum: ["small", "medium", "large", "XL"],
          required: true,
        },
      },
    ],

    totalPrice: { type: Number, required: true },
    image: String,

    //  Coupon Snapshot
    coupon: {
      code: { type: String },
      discount: { type: Number },
    },

    finalPrice: { type: Number, required: true },

    status: {
      type: String,
      enum: ["pending", "preparing", "on-the-way", "delivered", "canceled"],
      default: "pending",
    },

    cancellationReason: { type: String, default: "" },
    cancelledAt: { type: Date },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    deliveryInfo: {
      first_name: { type: String, required: true },
      last_name: { type: String, required: true },
      phone_number: { type: String, required: true },
      email: { type: String },
      address: { type: String, required: true },
      city: { type: String, default: "Cairo" },
      notes: { type: String },
    },

    paymentMethod: {
      type: String,
      enum: ["cash"],
      default: "cash",
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },

    currency: {
      type: String,
      default: "EGP",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
