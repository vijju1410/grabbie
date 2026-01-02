// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Notification = require('../models/notification');
const protect = require('../middleware/auth');
const protectAdminOrVendor = (req, res, next) => {
  // First call the main protect middleware to populate req.user
  return protect(req, res, function afterProtect(err) {
    if (err) return next(err);
    // now req.user should be present
    const role = req.user && req.user.role;
    if (!role) return res.status(403).json({ message: 'Forbidden - no role' });
    if (role === 'admin' || role === 'vendor') return next();
    return res.status(403).json({ message: 'Forbidden - require admin/vendor' });
  });
};
// If you want an admin-only endpoint, use this:
const protectAdminOnly = (req, res, next) => {
  return protect(req, res, function afterProtect(err) {
    if (err) return next(err);
    const role = req.user && req.user.role;
    if (role === 'admin') return next();
    return res.status(403).json({ message: 'Forbidden - admin only' });
  });
};



let runtimeSettings = {
  deliveryCharge: process.env.DEFAULT_DELIVERY_CHARGE ? Number(process.env.DEFAULT_DELIVERY_CHARGE) : 30
};
router.get('/settings/delivery-charge', protectAdminOrVendor, async (req, res) => {
  try {
    return res.json({ deliveryCharge: runtimeSettings.deliveryCharge });
  } catch (err) {
    console.error('Failed to fetch delivery charge', err);
    return res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

router.put('/settings/delivery-charge', protectAdminOnly, async (req, res) => {
  try {
    const { deliveryCharge } = req.body;
    const val = Number(deliveryCharge);
    if (isNaN(val) || val < 0) return res.status(400).json({ message: 'Invalid deliveryCharge' });

    // update runtime and optionally override env (note: env changes won't persist across restarts)
    runtimeSettings.deliveryCharge = val;
    process.env.DEFAULT_DELIVERY_CHARGE = String(val); // optional

    return res.json({ message: 'Delivery charge updated', deliveryCharge: runtimeSettings.deliveryCharge });
  } catch (err) {
    console.error('Failed to update delivery charge', err);
    return res.status(500).json({ message: 'Failed to update settings' });
  }
});
// Simple admin-only gate (assumes protect sets req.user)
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin')
    return res.status(403).json({ message: 'Admin only' });
  next();
};

// Get pending vendors
router.get('/pending-vendors', protect, adminOnly, async (req, res) => {
  try {
    const pending = await User.find({ role: 'vendor', vendorApproved: false, vendorStatus: 'pending' })
      .select('-password');
    res.json(pending);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch pending vendors', error: err.message });
  }
});




// Approve vendor
router.put('/approve-vendor/:id', protect, adminOnly, async (req, res) => {
  try {
    const vendor = await User.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

    vendor.vendorApproved = true;
    vendor.vendorStatus = 'approved';
    await vendor.save();

    // Notify the vendor
    await Notification.create({
      recipientRole: 'vendor',
      toUser: vendor._id,
      type: 'vendor_approved',
      title: 'Vendor account approved',
      message: `Your vendor account (${vendor.businessName || vendor.email}) has been approved.`,
      meta: {},
    });

    res.json({ message: 'Vendor approved', vendor });
  } catch (err) {
    res.status(500).json({ message: 'Approval failed', error: err.message });
  }
});
// Reject vendor
router.put('/reject-vendor/:id', protect, adminOnly, async (req, res) => {
  try {
    const vendor = await User.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

    vendor.vendorApproved = false;
    vendor.vendorStatus = 'rejected';
    await vendor.save();

    // Notify the vendor
    await Notification.create({
      recipientRole: 'vendor',
      toUser: vendor._id,
      type: 'vendor_rejected',
      title: 'Vendor account rejected',
      message: `Your vendor account (${vendor.businessName || vendor.email}) has been rejected.`,
      meta: {},
    });

    res.json({ message: 'Vendor rejected', vendor });
  } catch (err) {
    res.status(500).json({ message: 'Rejection failed', error: err.message });
  }
});
// Get pending drivers
router.get('/pending-drivers', protect, adminOnly, async (req, res) => {
  try {
    const pending = await User.find({ role: 'driver', driverStatus: 'pending' }).select('-password');
    res.json(pending);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch pending drivers', error: err.message });
  }
});

// Approve driver
router.put('/approve-driver/:id', protect, adminOnly, async (req, res) => {
  try {
    const driver = await User.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });

    driver.driverStatus = 'approved';
    await driver.save();

    // Notify driver
    await Notification.create({
      recipientRole: 'driver',
      toUser: driver._id,
      type: 'driver_approved',
      title: 'Driver account approved',
      message: `Your driver account has been approved.`,
      meta: {},
    });

    res.json({ message: 'Driver approved', driver });
  } catch (err) {
    res.status(500).json({ message: 'Approval failed', error: err.message });
  }
});

// Reject driver
router.put('/reject-driver/:id', protect, adminOnly, async (req, res) => {
  try {
    const driver = await User.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });

    driver.driverStatus = 'rejected';
    await driver.save();

    // Notify driver
    await Notification.create({
      recipientRole: 'driver',
      toUser: driver._id,
      type: 'driver_rejected',
      title: 'Driver account rejected',
      message: `Your driver account has been rejected.`,
      meta: {},
    });

    res.json({ message: 'Driver rejected', driver });
  } catch (err) {
    res.status(500).json({ message: 'Rejection failed', error: err.message });
  }
});

// Notifications for admin
router.get('/notifications', protect, adminOnly, async (req, res) => {
  try {
    const list = await Notification.find({
      $or: [{ recipientRole: 'admin' }, { recipientRole: 'all' }],
    })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: err.message });
  }
});

// Mark notification read
router.put('/notifications/:id/read', protect, adminOnly, async (req, res) => {
  try {
    const note = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark notification read', error: err.message });
  }
});

module.exports = router;
