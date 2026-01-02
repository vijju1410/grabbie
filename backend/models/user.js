const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: function () {
        return !this.googleId; // password required ONLY if not Google user
      },
    },

    // ✅ UNIQUE PHONE NUMBER (REAL-LIFE RULE)
    phone: {
      type: String,
      unique: true,
      sparse: true, // allows multiple nulls (Google users)
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    profileImage: { type: String },

    role: {
      type: String,
      enum: ["customer", "vendor", "driver", "admin"],
      default: "customer",
    },

    /** ---------------- Vendor fields ---------------- */
    businessName: { type: String },
    businessAddress: { type: String },
    businessPhone: { type: String },
    businessCategory: { type: String },

    vendorApproved: { type: Boolean, default: false },
    vendorStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "n/a"],
      default: "n/a",
    },

    /** ---------------- Driver fields ---------------- */
    driverApproved: { type: Boolean, default: false },
    driverStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "n/a"],
      default: "n/a",
    },

    licenseNumber: { type: String },
    vehicleNumber: { type: String },
    idProof: { type: String },
  },
  { timestamps: true }
);

/* ================= INDEXES ================= */

// Email must be unique
userSchema.index({ email: 1 }, { unique: true });

// ✅ Phone must be unique (when provided)
userSchema.index({ phone: 1 }, { unique: true, sparse: true });

/* ================= Helper Methods ================= */

userSchema.methods.isRejected = function () {
  return this.vendorStatus === "rejected" || this.driverStatus === "rejected";
};

userSchema.methods.isPendingApproval = function () {
  return this.vendorStatus === "pending" || this.driverStatus === "pending";
};

userSchema.methods.resubmitApplication = function () {
  if (this.role === "vendor") {
    this.vendorStatus = "pending";
    this.vendorApproved = false;
  }
  if (this.role === "driver") {
    this.driverStatus = "pending";
    this.driverApproved = false;
  }
};

module.exports = mongoose.model("User", userSchema);
