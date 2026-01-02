const deliverySchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  deliveryBoy: { type: String },
  liveLocation: { type: String },
  status: { type: String, enum: ['Pending', 'In Transit', 'Delivered'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Delivery', deliverySchema);
