const express = require("express");
const router = express.Router();
const Order = require("../models/order");
const protect = require("../middleware/auth");

// 🧠 SMART CHATBOT (FINAL)
router.post("/", protect, async (req, res) => {
  try {
    const { message } = req.body;
    const msg = message.toLowerCase();
    const userId = req.user._id;

    let reply = "🤖 Sorry, I didn’t understand. Try asking about orders, delivery, or payments.";

    // 🔥 GET ORDERS WITH PRODUCT DETAILS
    const userOrders = await Order.find({ customerId: userId })
      .populate("products.productId", "name price")
      .sort({ createdAt: -1 });

    // ======================
    // GREETING
    // ======================
    if (msg.includes("hello") || msg.includes("hi")) {
      reply = "Hi 👋 Welcome to Grabbie! How can I help you today?";
    }

    // ======================
    // ORDER DETAILS
    // ======================
    else if (
      msg.includes("my order") ||
      msg.includes("last order") ||
      msg.includes("order details")
    ) {
      const order = userOrders[0];

      if (!order) {
        reply = "❌ You have no orders yet.";
      } else {
        const items = order.products
          .map(p => `${p.productId?.name} (x${p.quantity})`)
          .join(", ");

        reply = `📦 Order #${order._id.toString().slice(-5)}
Status: ${order.status}
Items: ${items}
Total: ₹${order.totalAmount}`;
      }
    }

    // ======================
    // TRACK ORDER (FIXED)
    // ======================
    else if (
      msg.includes("order") &&
      (msg.includes("where") || msg.includes("track") || msg.includes("status"))
    ) {
      const order = userOrders[0];

      if (!order) {
        reply = "❌ No active order found.";
      } else {
        const items = order.products
          .map(p => p.productId?.name)
          .join(", ");

        reply = `🚚 Your order (${items}) is currently ${order.status}.`;
      }
    }

    // ======================
    // CANCEL CONFIRMATION
    // ======================
    else if (msg.includes("cancel") && !msg.includes("confirm")) {
      reply = "⚠️ Are you sure you want to cancel your last order? Type 'confirm cancel'";
    }

    // ======================
    // CONFIRM CANCEL
    // ======================
    else if (msg.includes("confirm cancel")) {
      const order = userOrders[0];

      if (!order) {
        reply = "❌ No order found.";
      } 
      else if (order.status !== "Placed") {
        reply = `⚠️ Cannot cancel. Current status: ${order.status}`;
      } 
      else {
        order.status = "Cancelled";
        await order.save();
        reply = "❌ Order cancelled successfully.";
      }
    }

    // ======================
    // DELIVERY
    // ======================
    else if (msg.includes("delivery")) {
      reply = "🚚 Delivery usually takes 30–45 minutes.";
    }

    // ======================
    // PAYMENT
    // ======================
    else if (msg.includes("payment")) {
      reply = "💳 We support UPI, cards, and cash on delivery.";
    }

    // ======================
    // OFFERS
    // ======================
    else if (msg.includes("offer") || msg.includes("discount")) {
      reply = "🎉 Check homepage for latest deals!";
    }

    // ======================
    // HELP
    // ======================
    else if (msg.includes("help")) {
      reply = "🙌 Ask me about your orders, cancellations, delivery, or payments.";
    }

    res.json({ reply });

  } catch (error) {
    console.error("CHATBOT ERROR:", error);
    res.status(500).json({ reply: "⚠️ Chatbot error" });
  }
});

module.exports = router;