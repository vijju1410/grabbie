const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/user");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI);

async function createAdmin() {
  try {
    // ✅ Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      console.log("✅ Admin already exists:", existingAdmin.email);
      return;
    }

    const hashedPassword = await bcrypt.hash("admin", 10);

    const admin = new User({
      name: "Super Admin",
      email: "admin@gmail.com",
      phone: "+91790983889",
      password: hashedPassword,
      role: "admin",
    });

    await admin.save();
    console.log("✅ Admin created successfully");
  } catch (err) {
    console.error("❌ Error creating admin:", err);
  } finally {
    mongoose.connection.close();
  }
}

createAdmin();
