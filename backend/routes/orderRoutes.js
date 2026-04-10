const express = require("express");
const router = express.Router();
const Order = require("../models/order");
const Cart = require("../models/cart");
const protect = require("../middleware/auth");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");

const PDFDocument = require("pdfkit");

// ✅ Multer memory storage (SAFE for free hosting)
const upload = multer({
  storage: multer.memoryStorage(),
});

// ✅ Cloudinary helper for proofs
const uploadProofToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "grabbie/order-proofs" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });


/**
 * Helpers for socket emissions scoped to vendors and customer
 */
const extractVendorIds = (order) => {
  // accepts either mongoose doc or plain object (populated or not)
  const ids = new Set();
  (order.products || []).forEach(p => {
    // item-level vendorId (saved on order item)
    if (p.vendorId) ids.add(String(p.vendorId));
    // product-level vendor (populated product.productId.vendorId OR productId.vendorId as id)
    const prod = p.productId;
    if (prod && prod.vendorId) ids.add(String(prod.vendorId));
  });
  return Array.from(ids);
};

const emitToVendorsAndCustomer = async (req, orderOrId, eventName, payload = {}) => {
  try {
    const io = req.app.get('io');
    if (!io) return;

    // ensure we have a full order object (populated) to extract vendor ids
    let order = orderOrId;
    if (!order || !order.products) {
      order = await Order.findById(orderOrId)
        .populate({
          path: "products.productId",
          select: "name price image vendorId",
          populate: {
            path: "vendorId",
            model: "User",
            select: "businessName businessAddress businessPhone"
          }
        })
        .lean();
      if (!order) return;
    }

    const vendorIds = extractVendorIds(order);
    // emit to each vendor room
    vendorIds.forEach(vId => {
      try {
        io.to(`vendor_${vId}`).emit(eventName, { order, ...payload });
      } catch (e) {
        console.warn("emit to vendor failed", vId, e);
      }
    });

    // also emit to customer-specific room if any (frontend should join user_<id> room)
    if (order.customerId) {
      try {
        const custId = typeof order.customerId === 'object' ? (order.customerId._id || order.customerId) : order.customerId;
        io.to(`user_${custId}`).emit(eventName, { order, ...payload });
      } catch (e) { /* ignore */ }
    }
  } catch (e) {
    console.warn("emitToVendorsAndCustomer failed:", e);
  }
};

/**
 * Place new order
 */
router.post("/place", protect, async (req, res) => {
  try {
    const {
      products,
      totalAmount,
      deliveryDetails,
      paymentMethod,
      charges, // ✅ RECEIVE CHARGES
    } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "No products provided" });
    }

    const Product = require("../models/product");
    const User = require("../models/user");

    // ✅ STOCK CHECK + REDUCE
for (const item of products) {
  const product = await Product.findById(item.productId);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  if (product.stock < item.quantity) {
    return res.status(400).json({
      message: `${product.name} is out of stock`,
    });
  }

  // 🔥 REDUCE STOCK
  product.stock -= item.quantity;
  await product.save();

  const io = req.app.get("io");

if (io) {
  io.emit("stockUpdated", {
    productId: product._id,
    stock: product.stock,
  });
}
}

    const enrichedItems = await Promise.all(
      products.map(async (item) => {
        const prod = await Product.findById(item.productId).lean();
        if (!prod) throw new Error("Product not found");

        const vendorId = prod.vendorId || null;
        const vendor = vendorId ? await User.findById(vendorId).lean() : null;

        return {
          productId: item.productId,
          quantity: item.quantity,
          vendorId: vendor ? vendor._id : null,
          vendorSnapshot: vendor
            ? {
                businessName: vendor.businessName || "",
                businessAddress: vendor.businessAddress || "",
                businessPhone: vendor.businessPhone || "",
              }
            : null,
        };
      })
    );

    const order = new Order({
      customerId: req.user._id,
      products: enrichedItems,
      totalAmount: Number(totalAmount),
      charges: {
  itemsTotal: Number(charges.itemsTotal || 0),
  serviceCharge: Number(charges.serviceCharge || 0),
  gst: Number(charges.gst || 0),
  platformFee: Number(charges.platformFee || 0),

  deliveryCharge: Number(charges.deliveryCharge || 0), // customer pays

  driverEarning: Math.round((charges.deliveryCharge || 0) * 0.7), // 👈 NEW (70% to driver)

  tip: Number(charges.tip || 0),
  grandTotal: Number(charges.grandTotal || totalAmount),
},
      deliveryDetails,
      paymentMethod,
      status: "Placed",
    });

    await order.save();

    await Cart.findOneAndUpdate(
      { userId: req.user._id },
      { products: [] }
    );

    await emitToVendorsAndCustomer(req, order._id, "orderCreated", {
      message: "New order placed",
    });

    res.status(201).json({ message: "Order placed successfully", order });
  } catch (err) {
    console.error("Order placement error:", err);
    res.status(500).json({ message: "Order failed", error: err.message });
  }
});


/**
 * Active orders for drivers
 */
router.get("/active", protect, async (req, res) => {
  if (req.user.role !== "driver") {
    return res.status(403).json({ message: "Only drivers can view active orders" });
  }

  try {
    const orders = await Order.find({ status: "Out for Delivery", assignedDriver: req.user._id })
      .populate("customerId", "name email")
      .populate({
        path: "products.productId",
        select: "name price image vendorId",
        populate: {
          path: "vendorId",
          model: "User",
          select: "businessName businessAddress businessPhone"
        }
      })
      .sort({ createdAt: -1 })
      .lean(); // convert to plain JS objects

    // Ensure deliveryDetails is always present
    const ordersWithDelivery = orders.map((order) => ({
      ...order,
      deliveryDetails: order.deliveryDetails || {
        fullName: "",
        phone: "",
        email: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: ""
      }
    }));

    res.json(ordersWithDelivery);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch active orders", error: err.message });
  }
});

/**
 * Available orders for drivers to accept
 */

// GET /api/orders/driver/stats
// DRIVER STATS
// routes/orderRoutes.js
router.get("/driver/stats", protect, async (req, res) => {
  try {
    const driverId = req.user._id;

    const deliveredOrders = await Order.find({
      assignedDriver: driverId,
      status: "Delivered"
    });

    const totalDeliveries = deliveredOrders.length;

    const totalEarnings = deliveredOrders.reduce(
  (sum, order) => sum + (order.charges?.driverEarning || 0),
  0
);

    const averageRating =
      deliveredOrders.length > 0
        ? (
            deliveredOrders.reduce((s, o) => s + (o.driverRating || 5), 0) /
            deliveredOrders.length
          ).toFixed(1)
        : 0;

    res.json({
      totalDeliveries,
      totalEarnings,
      averageRating,
      notificationsCount: 0,
      deliveredOrders
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load driver stats" });
  }
});

const User = require("../models/user");

router.get("/available", protect, async (req, res) => {
  if (req.user.role !== "driver") {
    return res.status(403).json({ message: "Only drivers can view available orders" });
  }

  const driver = await User.findById(req.user._id);

  if (!driver.isAvailable) {
    return res.json([]); // 🔥 no orders if offline
  }

  const orders = await Order.find({
  status: "Ready for Pickup",
  assignedDriver: null
})
.populate("customerId", "name email")
.populate({
  path: "products.productId",
  select: "name price image vendorId",
  populate: {
    path: "vendorId",
    model: "User",
    select: "businessName businessAddress businessPhone"
  }
});

  res.json(orders);
});
/**
 * Driver marks delivered
 */
router.put("/:orderId/deliver", protect, async (req, res) => {
  try {
    const { orderId } = req.params;

    if (req.user.role !== "driver") {
      return res.status(403).json({ message: "Only drivers can mark orders as delivered" });
    }

    const order = await Order.findById(orderId);

    if (!order) return res.status(404).json({ message: "Order not found" });

    // Only assigned driver can mark it delivered
    if (!order.assignedDriver || order.assignedDriver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not assigned to this order" });
    }

    if (order.status !== "Out for Delivery") {
      return res.status(400).json({ message: `Order cannot be delivered. Current status: ${order.status}` });
    }

    order.status = "Delivered";

    await order.save();

    // emit targeted update to vendors + customer
    await emitToVendorsAndCustomer(req, order._id, "orderUpdated", { status: "Delivered" });

    res.json({ message: "Order marked as delivered", order });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark order as delivered", error: err.message });
  }
});

/**
 * Assign order to driver
 */
router.put("/:orderId/assign", protect, async (req, res) => {
  if (req.user.role !== "driver") {
    return res.status(403).json({ message: "Only drivers can accept orders" });
  }

  const order = await Order.findById(req.params.orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });

  if (order.status !== "Ready for Pickup" || order.assignedDriver) {
    return res.status(400).json({ message: "Order not ready for pickup" });
  }

  order.assignedDriver = req.user._id;
  order.status = "Out for Delivery";

  order.statusHistory.push({
    status: "Out for Delivery",
    by: req.user.name || "driver"
  });

  await order.save();

  await emitToVendorsAndCustomer(req, order._id, "orderUpdated", {
    status: "Out for Delivery"
  });

  res.json({ message: "Order accepted by driver", order });
});
   
router.get("/:orderId/invoice", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("customerId", "name email")
      .populate("products.productId", "name price");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.customerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (order.status !== "Delivered") {
      return res
        .status(400)
        .json({ message: "Invoice available after delivery" });
    }

    const charges = order.charges || {};
    const safeInvoiceId = order._id.toString().slice(-6);

    const doc = new PDFDocument({ size: "A4", margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoice-${safeInvoiceId}.pdf"`
    );

    doc.pipe(res);

    /* ================= HEADER ================= */
    doc.rect(0, 0, 612, 80).fill("#16a34a");

    doc.fillColor("white").fontSize(22).text("GRABBIE", 40, 25);
    doc
      .fontSize(10)
      .text("Grab local deals, delivered quick", 40, 55);

    doc.fillColor("black").moveDown(4);

    /* ================= INVOICE INFO ================= */
    doc.fontSize(10);
    doc.text(`Invoice No: INV-${safeInvoiceId}`);
    doc.text(`Order ID: ${order._id}`);
    doc.text(`Order Date: ${order.createdAt.toDateString()}`);
    doc.moveDown();

    /* ================= BILL TO ================= */
    doc.fontSize(12).text("Bill To:", { underline: true });
    doc.fontSize(10);
    doc.text(order.customerId.name);
    doc.text(order.customerId.email);
    doc.text(
      `${order.deliveryDetails.addressLine1}, ${order.deliveryDetails.city}, ${order.deliveryDetails.state} - ${order.deliveryDetails.postalCode}`
    );
    doc.moveDown();

    /* ================= ITEMS TABLE ================= */
    doc.fontSize(12).text("Order Items", { underline: true });
    doc.moveDown(0.5);

   doc.font("Helvetica-Bold").fontSize(10);

doc.text("Item", 40, doc.y, { width: 220 });
doc.text("Qty", 280, doc.y, { width: 60, align: "center" });
doc.text("Price", 360, doc.y, { width: 80, align: "right" });
doc.text("Total", 460, doc.y, { width: 80, align: "right" });

doc.moveDown(0.4);
doc.moveTo(40, doc.y).lineTo(540, doc.y).stroke();

doc.font("Helvetica");

let y = doc.y + 6;

order.products.forEach((item) => {
  const total = item.productId.price * item.quantity;

  doc.text(item.productId.name, 40, y, { width: 220 });
  doc.text(item.quantity.toString(), 280, y, { width: 60, align: "center" });
  doc.text(`Rs:${item.productId.price.toFixed(2)}`, 360, y, {
    width: 80,
    align: "right",
  });
  doc.text(`Rs:.${total.toFixed(2)}`, 460, y, {
    width: 80,
    align: "right",
  });

  y += 22;
});


    doc.moveDown(2);

    /* ================= CHARGES BOX ================= */
    /* ================= CHARGES BOX ================= */
const boxY = doc.y;

doc.rect(330, boxY, 240, 160).stroke();
doc.fontSize(10).fillColor("black");

const row = (label, value, offset) => {
  doc.text(label, 340, boxY + offset);
  doc.text(`Rs:${Number(value).toFixed(2)}`, 470, boxY + offset, {
    align: "right",
  });
};

row("Items Subtotal:", charges.itemsTotal || 0, 12);
row("Service Charge:", charges.serviceCharge || 0, 35);
row("GST:", charges.gst || 0, 58);
row("Platform Fee:", charges.platformFee || 0, 81);
row("Delivery Charge:", charges.deliveryCharge || 0, 104);

/* ================= GRAND TOTAL ================= */
doc.rect(330, boxY + 125, 240, 45).fill("#dcfce7");

doc
  .fillColor("black")
  .font("Helvetica-Bold")
  .fontSize(13)
  .text("Grand Total:", 345, boxY + 140);

doc.text(
  `Rs:${(charges.grandTotal || order.totalAmount).toFixed(2)}`,
  470,
  boxY + 140,
  { align: "right" }
);


    doc.font("Helvetica").fillColor("black");

    /* ================= FOOTER ================= */
    doc.moveDown(4).fontSize(9).text(
      "This is a system generated invoice. No signature required.",
      { align: "center" }
    );

    doc.moveDown(3);

    const thankYouY = doc.y;

    doc.rect(170, thankYouY, 270, 40).fill("#f0fdf4");

    doc
      .fillColor("#166534")
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(
        "Thank you for shopping with us!",
        170,
        thankYouY + 12,
        { width: 270, align: "center" }
      );

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate invoice" });
  }
});


/**
 * Get all orders (admin/testing)
 */
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customerId", "name email")
      .populate("products.productId", "name price image");

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error });
  }
});

/**
 * Vendor orders (orders that belong to a vendor)
 */
router.get("/vendor/:vendorId", protect, async (req, res) => {
  try {
    const vendorId = req.params.vendorId;

    // First try: find orders where the order item itself has vendorId (saved at order placement)
    let vendorOrders = await Order.find({ "products.vendorId": vendorId })
      .populate({
        path: "products.productId",
        select: "name price image vendorId"
      })
      .populate("customerId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // If none found, fallback to scanning orders and checking product->vendorId (older documents)
    if (!vendorOrders || vendorOrders.length === 0) {
      const allOrders = await Order.find()
        .populate({
          path: "products.productId",
          select: "name price image vendorId",
          populate: {
            path: "vendorId",
            model: "User",
            select: "businessName businessAddress businessPhone"
          }
        })
        .populate("customerId", "name email")
        .sort({ createdAt: -1 })
        .lean();

      vendorOrders = allOrders.filter(order =>
        order.products.some(p =>
          // case 1: productId populated and has vendorId
          (p.productId && p.productId.vendorId && p.productId.vendorId.toString() === vendorId)
          // case 2: order item has vendorId saved on it (older/newer shape)
          || (p.vendorId && p.vendorId.toString() === vendorId)
        )
      );
    }

    // Return results (possibly empty array)
    return res.json(vendorOrders);
  } catch (error) {
    console.error("Error fetching vendor orders:", error);
    return res.status(500).json({ message: "Error fetching vendor orders", error: error.message });
  }
});
// GET /api/orders/vendor/:vendorId/ratings
router.get("/vendor/:vendorId/ratings", protect, async (req, res) => {
  try {
    const vendorId = req.params.vendorId;

    const orders = await Order.find({
      status: "Delivered",
      "customerRating.rating": { $ne: null },
      $or: [
        { "products.vendorId": vendorId },
        { "products.productId.vendorId": vendorId }
      ]
    }).select("customerRating");

    const totalReviews = orders.length;

    const avgRating =
      totalReviews > 0
        ? (
            orders.reduce(
              (sum, o) => sum + o.customerRating.rating,
              0
            ) / totalReviews
          ).toFixed(1)
        : "0.0";

    res.json({
      avgRating,
      totalReviews
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch vendor ratings" });
  }
});


// GET /api/orders/vendor/:vendorId/reviews
router.get("/vendor/:vendorId/reviews", protect, async (req, res) => {
  try {
    const { vendorId } = req.params;

    const orders = await Order.find({
      status: "Delivered",
      "customerRating.rating": { $ne: null },
      $or: [
        { "products.vendorId": vendorId },
        { "products.productId.vendorId": vendorId }
      ]
    })
      .populate("customerId", "name")
      .select("customerRating customerId createdAt")
      .sort({ createdAt: -1 });

    // format response
    const reviews = orders.map(order => ({
      _id: order._id,
      rating: order.customerRating.rating,
      comment: order.customerRating.review,
      createdAt: order.customerRating.ratedAt || order.createdAt,
      customer: {
        name: order.customerId?.name || "Customer"
      }
    }));

    res.json(reviews);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});

// 🔥 ARCHIVE ORDER (VENDOR)
router.put("/:orderId/archive", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) return res.status(404).json({ message: "Order not found" });

    // Only vendor related order
    order.isArchivedByVendor = true;
    await order.save();

    res.json({ message: "Order archived successfully" });

  } catch (err) {
    res.status(500).json({ message: "Failed to archive order" });
  }
});
// GET /api/orders/vendor/:vendorId/earnings
router.get("/vendor/:vendorId/earnings", protect, async (req, res) => {
  try {
    const { vendorId } = req.params;

    const orders = await Order.find({
      status: "Delivered",
      $or: [
        { "products.vendorId": vendorId },
        { "products.productId.vendorId": vendorId }
      ]
    }).populate("customerId", "name email")
.select("totalAmount createdAt customerId")

    let totalEarnings = 0;
    const dailyMap = {};
    const monthlyMap = {};

    orders.forEach(order => {
      const amount = Number(order.totalAmount || 0);
      totalEarnings += amount;
      

      const date = new Date(order.createdAt);

      // Daily
      const day = date.toLocaleDateString();
      dailyMap[day] = (dailyMap[day] || 0) + amount;

      // Monthly
      const month = `${date.getFullYear()}-${date.getMonth() + 1}`;
      monthlyMap[month] = (monthlyMap[month] || 0) + amount;
    });

    res.json({
      totalEarnings,
      totalOrders: orders.length,
      dailyEarnings: Object.entries(dailyMap).map(([date, amount]) => ({
        date,
        amount
      })),
      monthlyEarnings: Object.entries(monthlyMap).map(([month, amount]) => ({
        month,
        amount
      })),
      orders
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch earnings" });
  }
});
/**
 * Cancel order (customer only)
 */
router.put("/:orderId/cancel", protect, async (req, res) => {
  try {
    const { reason } = req.body;
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
const Product = require("../models/product");

// 🔄 RESTORE STOCK
for (const item of order.products) {
  const product = await Product.findById(item.productId);

  if (product) {
    product.stock += item.quantity;
    await product.save();
    const io = req.app.get("io");

if (io) {
  io.emit("stockUpdated", {
    productId: product._id,
    stock: product.stock,
  });
}
  }
}

    if (!order) return res.status(404).json({ message: "Order not found" });

    // Check if the logged-in user owns this order
    if (order.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to cancel this order" });
    }

    // Only allow cancel if order is not delivered or already cancelled
   // Only allow cancel for Placed & Accepted
const currentStatus = order.status?.toLowerCase();

if (!["placed", "accepted"].includes(currentStatus)) {
  return res.status(400).json({
    message: `Order cannot be cancelled at status: ${order.status}`
  });
}

// Update status
order.status = "Cancelled";
order.cancelReason = reason || "";
await order.save();

    // notify vendors + customer
   await emitToVendorsAndCustomer(req, order, "orderCancelled", {
  order: order, // 🔥 VERY IMPORTANT
  reason: order.cancelReason
});

    res.json({ message: "Order cancelled successfully", order });
  } catch (err) {
    res.status(500).json({ message: "Failed to cancel order", error: err.message });
  }
});
/**
 * Vendor reject order
 */
router.put("/:orderId/vendor-reject", protect, async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Only vendor can reject order" });
    }

    const order = await Order.findById(req.params.orderId);

    // ✅ FIRST CHECK (VERY IMPORTANT)
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // ✅ THEN CHECK OWNERSHIP
    const vendorOwnsOrder = order.products.some(
      p => p.vendorId?.toString() === req.user._id.toString()
    );

    if (!vendorOwnsOrder) {
      return res.status(403).json({ message: "Not your order" });
    }

    // ✅ STATUS CHECK
    if (order.status !== "Placed") {
      return res.status(400).json({ message: "Cannot reject now" });
    }

    // ✅ UPDATE ORDER
    order.status = "Cancelled";
    order.statusHistory.push({
      status: "Rejected by Vendor",
      by: req.user.name || "vendor"
    });

    await order.save();

    // ✅ 🔥 NOTIFICATION (MOST IMPORTANT)
    await emitToVendorsAndCustomer(req, order._id, "orderCancelled", {
      order,
      reason: "Rejected by Vendor"
    });

    res.json({ message: "Order rejected", order });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Reject failed" });
  }
});


/**
 * Orders for logged-in customer
 */
router.get("/my-orders", protect, async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user._id })
      .populate({
        path: "products.productId",
        select: "name price image vendorId",
        populate: {
          path: "vendorId",
          model: "User",
          select: "businessName businessAddress businessPhone"
        }
      })
        .populate("assignedDriver", "name phone vehicleNumber") // ⭐ ADD THIS

      .sort({ createdAt: -1 });

    // Ensure deliveryDetails is always included
    const ordersWithDelivery = orders.map((o) => ({
      ...o.toObject(), // convert Mongoose doc to plain JS object
      deliveryDetails: o.deliveryDetails || {}
    }));

    res.json(ordersWithDelivery);
  } catch (error) {
    res.status(500).json({ message: "Error fetching your orders", error });
  }
});
/**
 * Rate delivered order (customer only)
 */
router.post("/:orderId/rate", protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Only order owner
    if (order.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Only delivered orders
    if (order.status !== "Delivered") {
      return res.status(400).json({ message: "Order not delivered yet" });
    }

    // Prevent duplicate rating
    if (order.customerRating?.rating) {
      return res.status(400).json({ message: "Order already rated" });
    }

    order.customerRating = {
      rating,
      review: review || "",
      ratedAt: new Date()
    };

    await order.save();

    // (optional) emit socket update
    await emitToVendorsAndCustomer(req, order._id, "orderRated", {
      rating
    });

    res.json({
      message: "Thank you for rating your order",
      rating: order.customerRating
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to submit rating" });
  }
});

/**
 * Status update (any authorized user that your app allows)
 */
router.put('/:orderId/status', protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // update status and push to history
    order.status = status;
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status,
      note: note || '',
      by: req.user?.name || req.user?.email || 'system',
      at: new Date()
    });

    await order.save();
    const io = req.app.get("io");

if (io && order.status === "Ready for Pickup") {
  io.emit("newOrderAvailable", {
    order,
    message: "New order ready for pickup"
  });
}

    // emit socket event to vendors + customer
    await emitToVendorsAndCustomer(req, order._id, 'orderUpdated', { status });

    res.json({ message: 'Status updated', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update status', error: err.message });
  }
});

/**
 * Add internal note
 */
router.post('/:orderId/notes', protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { text } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.notes = order.notes || [];
    order.notes.push({
      text,
      by: req.user?.name || req.user?.email || 'vendor',
      at: new Date()
    });

    await order.save();

    // targeted emit
    await emitToVendorsAndCustomer(req, order._id, 'orderNoteAdded', { note: order.notes[order.notes.length - 1] });

    res.json({ message: 'Note added', note: order.notes[order.notes.length - 1] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add note', error: err.message });
  }
});

/**
 * Upload proof (multipart)
 */
router.post('/:orderId/proof', protect, upload.single('file'), async (req, res) => {
  try {
    const { orderId } = req.params;
    const type = req.body.type || 'proof';
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // 🔥 Upload proof to Cloudinary
    const result = await uploadProofToCloudinary(req.file.buffer);

    order.proofs = order.proofs || [];
    const proof = {
      url: result.secure_url, // ✅ SAFE URL
      type,
      uploadedBy: req.user._id,
      at: new Date()
    };

    order.proofs.push(proof);
    await order.save();

    await emitToVendorsAndCustomer(req, order._id, 'orderProofUploaded', { proof });

    res.json({ message: 'Proof uploaded', proof });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to upload proof', error: err.message });
  }
});

/**
 * Change price
 */
router.put('/:orderId/price', protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { totalAmount } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const old = order.totalAmount;
    order.totalAmount = parseFloat(totalAmount);
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status: `Price changed ${old} → ${order.totalAmount}`,
      note: `Price updated by ${req.user?.name || req.user?.email}`,
      by: req.user?.name || req.user?.email,
      at: new Date()
    });

    await order.save();

    // targeted emit
    await emitToVendorsAndCustomer(req, order._id, 'orderUpdated', { totalAmount: order.totalAmount });

    res.json({ message: 'Price updated', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update price', error: err.message });
  }
});
// GET /api/products/:productId/ratings-summary
router.get("/product/:productId/ratings-summary", async (req, res) => {
  try {
    const { productId } = req.params;

    const orders = await Order.find({
      status: "Delivered",
      "customerRating.rating": { $ne: null },
      "products.productId": productId
    }).select("customerRating");

    const totalReviews = orders.length;

    const avgRating =
      totalReviews > 0
        ? (
            orders.reduce(
              (sum, o) => sum + o.customerRating.rating,
              0
            ) / totalReviews
          ).toFixed(1)
        : "0.0";

    res.json({
      avgRating,
      totalReviews
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch product ratings" });
  }
});
// GET /api/orders/vendor/:vendorId/delivery
router.get("/vendor/:vendorId/delivery", protect, async (req, res) => {
  try {
    const { vendorId } = req.params;

    const orders = await Order.find({
      $or: [
        { "products.vendorId": vendorId },
        { "products.productId.vendorId": vendorId }
      ],
      status: { $in: ["Ready for Pickup", "Out for Delivery"] }
    })
    .populate("assignedDriver", "name phone vehicleNumber")
    .populate("customerId", "name phone")
    .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch delivery orders" });
  }
});

module.exports = router;
