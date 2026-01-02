// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Notification = require('../models/notification');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require("multer");
const cloudinary = require("../config/cloudinary");

const protect = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ✅ SAFE multer (memory only)
const upload = multer({
  storage: multer.memoryStorage(),
});

// ✅ Cloudinary helper (users)
const uploadUserFile = (buffer, folder) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });


// ===== Register =====
router.post(
  '/register',
  upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'idProof', maxCount: 1 },
  ]),
  async (req, res) => {
    const {
      name,
      email,
      password,
      role,
      phone,
      businessName,
      businessAddress,
      businessPhone,
      businessCategory,
      vehicleNumber,
      licenseNumber,
    } = req.body;
    // Normalize phone to +91XXXXXXXXXX
const normalizedPhone = phone
  ? phone.startsWith('+91')
    ? phone
    : `+91${phone}`
  : null;


    try {
      // *** CHANGE: smarter "already exists" handling ***
      const existing = await User.findOne({
  $or: [
    { email },
    ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
  ],
});


      if (existing) {
        // Phone already exists
if (existing.phone && existing.phone === normalizedPhone) {
  return res.status(409).json({
    message: 'Mobile number already registered. Please log in.',
    field: 'phone',
  });
}

        // If the existing account is a driver who got rejected
        if (existing.role === 'driver' && existing.driverStatus === 'rejected') {
          return res.status(409).json({
            code: 'APPLICATION_REJECTED',
            message:
              'Your driver application was rejected earlier. Please log in and resubmit documents for review.',
            canResubmit: true,
            role: 'driver',
          });
        }
        // If the existing account is a vendor who got rejected
        if (existing.role === 'vendor' && existing.vendorStatus === 'rejected') {
          return res.status(409).json({
            code: 'APPLICATION_REJECTED',
            message:
              'Your vendor application was rejected earlier. Please log in and resubmit documents for review.',
            canResubmit: true,
            role: 'vendor',
          });
        }

        // Generic already-exists case
        return res.status(400).json({ message: 'User already exists. Please log in.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = new User({
        name,
        email,
        password: hashedPassword,
        role,
        phone: normalizedPhone,
        businessName,
        businessAddress,
        businessPhone,
        businessCategory,
        vehicleNumber,
        licenseNumber,
        profileImage: req.files?.profileImage
  ? (await uploadUserFile(req.files.profileImage[0].buffer, "grabbie/users/profile")).secure_url
  : null,

idProof: req.files?.idProof
  ? (await uploadUserFile(req.files.idProof[0].buffer, "grabbie/users/idproof")).secure_url
  : null,

      });

      // DRIVER REGISTRATION
      if (role === 'driver') {
        user.driverStatus = 'pending';

        await Notification.create({
          recipientRole: 'admin',
          type: 'driver_application',
          title: 'New driver application',
          message: `${name} requested driver access.`,
          meta: {
            applicantEmail: email,
            vehicleNumber,
            licenseNumber,
          },
        });
      } else {
        user.driverStatus = 'n/a';
      }

      // VENDOR REGISTRATION
      if (role === 'vendor') {
        user.vendorApproved = false;
        user.vendorStatus = 'pending';

        await Notification.create({
          recipientRole: 'admin',
          type: 'vendor_application',
          title: 'New vendor application',
          message: `${name} requested vendor access.`,
          meta: {
            applicantEmail: email,
            businessName,
            businessAddress,
          },
        });
      } else {
        user.vendorApproved = false;
        user.vendorStatus = 'n/a';
      }

      await user.save();
      res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
      
  if (err.code === 11000 && err.keyPattern?.phone) {
    return res.status(409).json({
      message: 'Mobile number already registered. Please log in.',
      field: 'phone',
    });
  }

  res.status(500).json({ message: 'Registration failed', error: err.message });
}

    }
  
);

// ===== Login =====
// ===== Login =====
// ===== Login =====
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // BLOCK login for pending/rejected drivers/vendors
 // DRIVER
if (user.role === 'driver') {
  if (user.driverStatus === 'pending') {
    return res.status(403).json({ message: 'Your driver account is pending approval from admin.' });
  }
  if (user.driverStatus === 'rejected') {
    // ✅ Allow login but indicate resubmission
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return res.json({
      token,
      user,
      code: 'APPLICATION_REJECTED',
      canResubmit: true,
      message: 'Your driver account was rejected. ',
    });
  }
}

// VENDOR
if (user.role === 'vendor') {
  if (user.vendorStatus === 'pending') {
    return res.status(403).json({ message: 'Your vendor account is pending approval from admin.' });
  }
  if (user.vendorStatus === 'rejected') {
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return res.json({
      token,
      user,
      code: 'APPLICATION_REJECTED',
      canResubmit: true,
      message: 'Your vendor account was rejected.',
    });
  }
}


    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// ===== Google Login =====
router.post('/google-login', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'No Google token provided' });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId, picture } = payload;

    // ✅ FIND BY EMAIL FIRST (CORRECT)
    let user = await User.findOne({ email });

    if (!user) {
      // CREATE NEW USER
      user = await User.create({
        name,
        email,
        googleId,
        profileImage: picture,
        role: 'customer',
        password: null,
      });
    } else if (!user.googleId) {
      // LINK GOOGLE ACCOUNT
      user.googleId = googleId;
      await user.save();
    }

    // 🚫 BLOCK pending/rejected logic (unchanged)
    if (user.role === 'driver') {
      if (user.driverStatus === 'pending') {
        return res.status(403).json({ message: 'Your driver account is pending approval from admin.' });
      }
      if (user.driverStatus === 'rejected') {
        const token = jwt.sign(
          { userId: user._id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '1d' }
        );
        return res.json({
          token,
          user,
          code: 'APPLICATION_REJECTED',
          canResubmit: true,
          message: 'Your driver account was rejected.',
        });
      }
    }

    if (user.role === 'vendor') {
      if (user.vendorStatus === 'pending') {
        return res.status(403).json({ message: 'Your vendor account is pending approval from admin.' });
      }
      if (user.vendorStatus === 'rejected') {
        const token = jwt.sign(
          { userId: user._id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '1d' }
        );
        return res.json({
          token,
          user,
          code: 'APPLICATION_REJECTED',
          canResubmit: true,
          message: 'Your vendor account was rejected.',
        });
      }
    }

    // ✅ CREATE JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, user });

  } catch (err) {
    console.error('Google login error:', err);
    res.status(401).json({ message: 'Google login failed', error: err.message });
  }
});


// ===== Profile =====
router.get('/profile', protect, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Fetch profile failed', error: err.message });
  }
});
router.put(
  '/profile',
  protect,
  upload.single('profileImage'),
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      /* ================= PHONE UNIQUENESS CHECK ================= */
      if (req.body.phone) {
        const normalizedPhone = req.body.phone.startsWith('+91')
          ? req.body.phone
          : `+91${req.body.phone}`;

        const existingUser = await User.findOne({
          phone: normalizedPhone,
          _id: { $ne: req.user._id }, // 👈 VERY IMPORTANT
        });

        if (existingUser) {
          return res.status(409).json({
            message: 'This mobile number is already in use by another account',
            field: 'phone',
          });
        }

        user.phone = normalizedPhone;
      }

      /* ================= OTHER FIELDS ================= */
      if (req.body.name) user.name = req.body.name;

     if (req.file) {
  const result = await uploadUserFile(req.file.buffer, "grabbie/users/profile");
  user.profileImage = result.secure_url;
}


      // vendor fields
      if (user.role === 'vendor') {
        if (req.body.businessName) user.businessName = req.body.businessName;
        if (req.body.businessAddress) user.businessAddress = req.body.businessAddress;
        if (req.body.businessCategory) user.businessCategory = req.body.businessCategory;
      }

      // driver fields
      if (user.role === 'driver') {
        if (req.body.vehicleNumber) user.vehicleNumber = req.body.vehicleNumber;
        if (req.body.licenseNumber) user.licenseNumber = req.body.licenseNumber;
      }

      const updatedUser = await user.save();
      res.json({ message: 'Profile updated successfully', user: updatedUser });

    } catch (err) {
      // Handle duplicate key error just in case
      if (err.code === 11000 && err.keyPattern?.phone) {
        return res.status(409).json({
          message: 'This mobile number is already in use',
          field: 'phone',
        });
      }

      res.status(500).json({
        message: 'Profile update failed',
        error: err.message,
      });
    }
  }
);

// ===== Get users =====
router.get('/', async (req, res) => {
  try {
    const { role } = req.query;
    const query = role ? { role } : {};
    const list = await User.find(query).select('-password');
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Fetch users failed', error: err.message });
  }
});

/* ========= ADMIN APPROVAL/REJECTION ROUTES ========= */
/*  NOTE: You already have proper admin-gated routes in /api/admin.
    These duplicates here are potentially unsafe if protect() doesn’t enforce admin-only.
    Kept as-is to avoid breaking your app. Consider locking them down later.
*/

// Approve Driver
router.put('/approve-driver/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'driver') {
      return res.status(404).json({ message: 'Driver not found' });
    }
    user.driverStatus = 'approved';
    await user.save();

    await Notification.create({
      toUser: user._id,
      type: 'driver_approved',
      title: 'Driver Application Approved',
      message: 'Congratulations! Your driver account has been approved.',
    });

    res.json({ message: 'Driver approved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Approve driver failed', error: err.message });
  }
});

// Reject Driver
router.put('/reject-driver/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'driver') {
      return res.status(404).json({ message: 'Driver not found' });
    }
    user.driverStatus = 'rejected';
    await user.save();

    await Notification.create({
      toUser: user._id,
      type: 'driver_rejected',
      title: 'Driver Application Rejected',
      message: 'Unfortunately, your driver account application has been rejected.',
    });

    res.json({ message: 'Driver rejected successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Reject driver failed', error: err.message });
  }
});

// Approve Vendor
router.put('/approve-vendor/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'vendor') {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    user.vendorStatus = 'approved';
    user.vendorApproved = true;
    await user.save();

    await Notification.create({
      toUser: user._id,
      type: 'vendor_approved',
      title: 'Vendor Application Approved',
      message: 'Congratulations! Your vendor account has been approved.',
    });

    res.json({ message: 'Vendor approved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Approve vendor failed', error: err.message });
  }
});

// Reject Vendor
router.put('/reject-vendor/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'vendor') {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    user.vendorStatus = 'rejected';
    user.vendorApproved = false;
    await user.save();

    await Notification.create({
      toUser: user._id,
      type: 'vendor_rejected',
      title: 'Vendor Application Rejected',
      message: 'Unfortunately, your vendor account application has been rejected.',
    });

    res.json({ message: 'Vendor rejected successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Reject vendor failed', error: err.message });
  }
});
router.get('/pending-drivers', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
  const pendingDrivers = await User.find({ role: 'driver', driverStatus: 'pending' }).select('-password');
  res.json(pendingDrivers);
});


/* ========= NEW: RESUBMIT ROUTES (driver/vendor) ========= */

// *** DRIVER RESUBMIT ***
// Body/form-data: vehicleNumber, licenseNumber, idProof (file)
router.post(
  '/resubmit/driver',
  protect,
  upload.single('idProof'),
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      if (!user || user.role !== 'driver') {
        return res.status(403).json({ message: 'Only drivers can resubmit' });
      }

      // Must be rejected or pending (allow both so they can fix docs while pending)
      if (!['rejected', 'pending'].includes(user.driverStatus)) {
        return res.status(400).json({ message: 'Your driver account is not eligible for resubmission' });
      }

      if (req.body.vehicleNumber) user.vehicleNumber = req.body.vehicleNumber;
      if (req.body.licenseNumber) user.licenseNumber = req.body.licenseNumber;
     if (req.file) {
  const result = await uploadUserFile(req.file.buffer, "grabbie/users/idproof");
  user.idProof = result.secure_url;
}


      user.driverStatus = 'pending'; // back to review
      await user.save();

      await Notification.create({
        recipientRole: 'admin',
        type: 'driver_resubmitted',
        title: 'Driver resubmission',
        message: `${user.name} resubmitted driver documents.`,
        meta: { userId: user._id, email: user.email },
      });

      res.json({ message: 'Driver documents resubmitted. Await approval.' });
    } catch (err) {
      res.status(500).json({ message: 'Driver resubmission failed', error: err.message });
    }
  }
);

// *** VENDOR RESUBMIT ***
// Body/form-data: businessName, businessAddress, businessPhone, businessCategory, idProof (file)
router.post(
  '/resubmit/vendor',
  protect,
  upload.single('idProof'),
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      if (!user || user.role !== 'vendor') {
        return res.status(403).json({ message: 'Only vendors can resubmit' });
      }

      if (!['rejected', 'pending'].includes(user.vendorStatus)) {
        return res.status(400).json({ message: 'Your vendor account is not eligible for resubmission' });
      }

      // Update vendor fields if provided
      ['businessName', 'businessAddress', 'businessPhone', 'businessCategory'].forEach((f) => {
        if (typeof req.body[f] !== 'undefined') user[f] = req.body[f];
      });
      if (req.file) {
  const result = await uploadUserFile(req.file.buffer, "grabbie/users/idproof");
  user.idProof = result.secure_url;
}


      user.vendorStatus = 'pending';
      user.vendorApproved = false;
      await user.save();

      await Notification.create({
        recipientRole: 'admin',
        type: 'vendor_resubmitted',
        title: 'Vendor resubmission',
        message: `${user.name} resubmitted vendor documents.`,
        meta: { userId: user._id, email: user.email },
      });

      res.json({ message: 'Vendor documents resubmitted. Await approval.' });
    } catch (err) {
      res.status(500).json({ message: 'Vendor resubmission failed', error: err.message });
    }
  }
);

module.exports = router;
