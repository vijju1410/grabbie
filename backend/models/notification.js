// backend/models/notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientRole: { type: String, enum: ['admin', 'vendor', 'driver', 'customer', 'all'], default: 'admin' },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional (for direct notifications)
    type: { 
      type: String, 
      enum: [
        'vendor_application',
        'vendor_approved',
                'vendor_rejected',   // ✅ add this

        'driver_application',
        'driver_approved',
        'driver_rejected',
        'order',
        'info'
      ], 
      default: 'info' 
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    meta: { type: Object, default: {} },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);

