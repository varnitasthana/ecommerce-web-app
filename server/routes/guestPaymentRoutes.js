const express = require("express");
const { createRazorpayOrder, verifyRazorpayPayment, createDemoCheckoutSession } = require("../controllers/paymentController");

const router = express.Router();

router.post("/create-order", createRazorpayOrder);
router.post("/verify", verifyRazorpayPayment);
router.post("/demo-checkout", createDemoCheckoutSession);

module.exports = router;
