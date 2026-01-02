const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

async function createAdmin() {
  try {
    // 1️⃣ Delete any existing admin
    await User.deleteMany({ role: 'admin' });
    console.log('Existing admin(s) deleted');

    // 2️⃣ Hash the password for new admin
    const hashedPassword = await bcrypt.hash('admin', 10); // change password as needed

    // 3️⃣ Create new admin
    const admin = new User({
      name: 'Super Admin',           // change name if needed
      email: 'admin@gmail.com',
      phone:'790983889',   // change email if needed
      password: hashedPassword,
      role: 'admin'
    });

    await admin.save();
    console.log('New admin created successfully');

  } catch (err) {
    console.error('Error creating admin:', err);
  } finally {
    mongoose.connection.close();
  }
}

createAdmin();
