const express = require("express");
const router = express.Router();
const Offer = require("../models/offer");
const protect = require("../middleware/auth");

// ✅ Create Offer
router.post("/", protect, async (req, res) => {
  try {
    const { productId, discountType, discountValue, expiryDate } = req.body;

    const offer = new Offer({
      vendorId: req.user._id,
      productId,
      discountType,
      discountValue,
      expiryDate
    });

    await offer.save();
    res.json({ message: "Offer created", offer });

  } catch (err) {
    res.status(500).json({ message: "Failed to create offer" });
  }
});

// ✅ Get Vendor Offers
router.get("/vendor", protect, async (req, res) => {
  try {
    const offers = await Offer.find({ vendorId: req.user._id })
      .populate("productId", "name");

    res.json(offers);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch offers" });
  }
});

// ✅ Delete Offer
router.delete("/:id", protect, async (req, res) => {
  try {
    await Offer.findByIdAndDelete(req.params.id);
    res.json({ message: "Offer deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

// GET /api/offers
router.get("/", async (req, res) => {
  try {
    const today = new Date();

    const offers = await Offer.find({
      $or: [
        { expiryDate: null },
        { expiryDate: { $gte: today } }
      ]
    }).populate("productId", "name price image");

    res.json(offers);

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch offers" });
  }
});
module.exports = router;