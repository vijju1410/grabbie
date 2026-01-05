// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const Cart = require('../models/cart');
const protect = require('../middleware/auth'); // session/token auth

// Get current user's cart
router.get('/', protect, async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user._id }).populate('products.productId');
  res.json(cart || { products: [] });
});

// Add or update product in cart
// Add or update product in cart
router.post('/add', protect, async (req, res) => {
  const { productId, quantity } = req.body;
  let cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) cart = new Cart({ userId: req.user._id, products: [] });

  const existing = cart.products.find(p => p.productId.toString() === productId);

  if (existing) {
    existing.quantity += quantity;
    // ✅ Prevent quantity from going below 1
    if (existing.quantity < 1) {
      existing.quantity = 1;
    }
  } else {
    // ✅ New product always starts with at least 1
    cart.products.push({ productId, quantity: Math.max(1, quantity) });
  }

  await cart.save();
  res.json(await cart.populate("products.productId")); // populate before sending
});


// Remove product
router.post('/remove', protect, async (req, res) => {
  const { productId } = req.body;
  const cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) return res.status(404).json({ message: 'Cart not found' });

  cart.products = cart.products.filter(p => p.productId.toString() !== productId);
  await cart.save();
  res.json(cart);
});

router.post('/update', protect, async (req, res) => {
  const { productId, quantity } = req.body;

  if (!quantity || quantity < 1) {
    return res.status(400).json({ message: "Invalid quantity" });
  }

  const cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  const item = cart.products.find(
    p => p.productId.toString() === productId
  );

  if (!item) return res.status(404).json({ message: "Item not found" });

  item.quantity = Number(quantity); // ✅ FORCE NUMBER
  await cart.save();

  res.json(await cart.populate("products.productId"));
});


module.exports = router;
