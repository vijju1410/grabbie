const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");

// ✅ Multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
});

// ✅ Cloudinary helper
const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "grabbie/categories" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });


// ---------------- GET ALL CATEGORIES ----------------
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});


// ---------------- ADD NEW CATEGORY ----------------
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name } = req.body;
    if (!req.file)
      return res.status(400).json({ message: "Image is required" });

    const result = await uploadToCloudinary(req.file.buffer);

    const newCategory = new Category({
      name,
      image: result.secure_url, // ✅ SAFE URL
    });

    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (err) {
    res.status(500).json({
      message: "Failed to add category",
      error: err.message,
    });
  }
});


// ---------------- UPDATE CATEGORY ----------------
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { name } = req.body;
    const updateData = { name };

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      updateData.image = result.secure_url;
    }

    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({
      message: "Failed to update category",
      error: err.message,
    });
  }
});


// ---------------- DELETE CATEGORY ----------------
router.delete("/:id", async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({
      message: "Failed to delete category",
      error: err.message,
    });
  }
});

module.exports = router;
