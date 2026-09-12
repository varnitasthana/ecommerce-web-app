const express = require("express");
const { createRazorpayOrder, verifyRazorpayPayment, handleRazorpayWebhook, createDemoCheckoutSession } = require("../controllers/paymentController");
const { isRazorpayConfigured, getPublicRazorpayKey } = require("../config/razorpay");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/create-order", protect, createRazorpayOrder);
router.post("/verify", protect, verifyRazorpayPayment);
router.post("/demo-checkout", protect, createDemoCheckoutSession);
router.get("/status", (req, res) => {
  res.json({ configured: isRazorpayConfigured(), publicKey: getPublicRazorpayKey() || null });
});

module.exports = router;
