const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  discountType: {
    type: String,
    enum: ["percent", "flat"],
    required: true
  },
  discountValue: {
    type: Number,
    required: true
  },
  expiryDate: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model("Offer", offerSchema);