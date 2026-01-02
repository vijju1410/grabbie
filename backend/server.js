// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

// Routes
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const cartRoutes = require("./routes/cartRoutes");
const adminRoutes = require("./routes/adminRoutes");
const paymentRoutes = require("./routes/payment.routes");

const app = express();
const server = http.createServer(app);

/* =========================
   CORS CONFIG (FINAL)
========================= */

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.FRONTEND_URL, // Vercel URL in production
].filter(Boolean); // removes undefined

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (Postman, mobile apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

/* =========================
   SOCKET.IO (MATCHES CORS)
========================= */

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// make io accessible in routes
app.set("io", io);

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("joinVendor", (vendorId) => {
    if (vendorId) {
      socket.join(`vendor_${vendorId}`);
      console.log(`Vendor joined: vendor_${vendorId}`);
    }
  });

  socket.on("joinUser", (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`User joined: user_${userId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

/* =========================
   API ROUTES
========================= */

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payment", paymentRoutes);

app.get("/", (req, res) => {
  res.send("🚀 Grabbie API is running...");
});

/* =========================
   DATABASE
========================= */

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI missing in .env");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });

/* =========================
   SERVER START
========================= */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

/* =========================
   GRACEFUL SHUTDOWN
========================= */

const shutdown = () => {
  console.log("🛑 Shutting down server...");
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log("🛑 MongoDB disconnected");
      process.exit(0);
    });
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
