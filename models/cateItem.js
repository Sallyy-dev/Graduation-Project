const mongoose = require("mongoose");
const cateItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    basePrice: { type: Number, required: true },
    images: [{ type: String, required: true }],
    sizes: [
      {
        size: {
          type: String,
          enum: ["small", "medium", "large", "XL"],
          required: true,
        },
        price: { type: Number, required: true },
      },
    ],
    stock: { type: Number, default: 0 },
    isBestSeller: { type: Boolean, default: false },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("CateItem", cateItemSchema);
