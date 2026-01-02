// backend/models/Order.js
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: { type: Number, required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  vendorSnapshot: {
    address: {
      addressLine1: { type: String },
      addressLine2: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String }
    },
    location: {
      lat: { type: Number },
      lng: { type: Number }
    },
    phone: { type: String }
  }
  // removed per-item charges here to keep a single order-level charges object
});

const noteSchema = new mongoose.Schema({
  text: String,
  by: { type: String },       // simple who added the note (vendor name, admin)
  at: { type: Date, default: Date.now }
}, { _id: false });

const proofSchema = new mongoose.Schema({
  url: String,                // stored file path or URL
  type: String,               // e.g. 'pickup', 'delivery'
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  at: { type: Date, default: Date.now }
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
  status: String,
  note: String,
  by: { type: String },       // who changed the status
  at: { type: Date, default: Date.now }
}, { _id: false });

// order-level charges schema (audit-able breakdown)
const chargesSchema = new mongoose.Schema({
  itemsTotal: { type: Number, default: 0 },
  serviceCharge: { type: Number, default: 0 },
  gst: { type: Number, default: 0 },
  platformFee: { type: Number, default: 0 },
  deliveryCharge: { type: Number, default: 0 },
  tip: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  products: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  // NEW: order-level charges breakdown
  charges: chargesSchema,
  paymentMethod: {
    type: String,
    enum: ['cod', 'online'],
    default: 'cod'
  },
  deliveryDetails: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: "India" },
    // optional lat/lng if you capture them
    latitude: { type: Number },
    longitude: { type: Number }
  },
  status: {
    type: String,
    default: 'Placed',
    enum: ['Placed', 'Accepted', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Delivered', 'Cancelled']
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  // NEW: internal notes, proofs (images), and status history
  notes: [noteSchema],
  proofs: [proofSchema],
  statusHistory: [statusHistorySchema],

// ================= CUSTOMER RATING =================
customerRating: {
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  review: {
    type: String,
    default: ""
  },
  ratedAt: {
    type: Date
  }
},

}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
