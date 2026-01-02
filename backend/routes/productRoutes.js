const express = require("express");
const router = express.Router();
const Product = require("../models/product");
const protect = require("../middleware/auth");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");

// ✅ Multer memory storage (NO local files)
const upload = multer({
  storage: multer.memoryStorage(),
});

// ✅ Cloudinary helper
const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "grabbie/products" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });


// ================= ADD PRODUCT =================
router.post("/add", protect, upload.single("image"), async (req, res) => {
  try {
    const { name, price, category, description } = req.body;

    let imageUrl = "";
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      imageUrl = result.secure_url;
    }

    const product = new Product({
      name,
      price,
      category,
      description,
      image: imageUrl,
      vendorId: req.user._id,
    });

    await product.save();
    res.status(201).json({ message: "Product added", product });
  } catch (err) {
    res.status(500).json({ message: "Add failed", error: err.message });
  }
});


// ================= GET PRODUCTS =================
router.get("/", async (req, res) => {
  try {
    const category = req.query.category;
    let filter = {};

    if (category) {
      const normalizedCategory = category
        .replace(/-/g, " ")
        .replace(/\band\b/gi, "&");

      filter = {
        category: { $regex: `^${normalizedCategory}$`, $options: "i" },
      };
    }

    const products = await Product.find(filter).populate(
      "vendorId",
      "name email"
    );

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products", error: error.message });
  }
});


// ================= SEARCH =================
router.get("/search/query", async (req, res) => {
  try {
    const { q, page = 1, limit = 6 } = req.query;

    if (!q || q.trim() === "") return res.json([]);

    const products = await Product.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ],
    })
      .populate("vendorId", "name email")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Search failed", error: error.message });
  }
});

// ================= GET PRODUCTS BY VENDOR =================
router.get("/vendor/:vendorId", protect, async (req, res) => {
  try {
    const products = await Product.find({
      vendorId: req.params.vendorId,
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch vendor products",
      error: error.message,
    });
  }
});

// ================= GET SINGLE =================
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "vendorId",
      "name email"
    );
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch product", error: error.message });
  }
});


// ================= UPDATE PRODUCT =================
router.put("/:id", protect, upload.single("image"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const { name, price, category, description } = req.body;

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      product.image = result.secure_url;
    }

    product.name = name || product.name;
    product.price = price || product.price;
    product.category = category || product.category;
    product.description = description || product.description;

    await product.save();
    res.json({ message: "Product updated", updated: product });
  } catch (error) {
    res.status(500).json({ message: "Failed to update product", error: error.message });
  }
});


// ================= DELETE =================
router.delete("/:id", protect, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete product", error: error.message });
  }
});

module.exports = router;
