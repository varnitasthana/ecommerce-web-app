const Razorpay = require("razorpay");

const isRealValue = (value) => Boolean(value && !/(your_|replace_me|_here|example\.com|test_replace)/i.test(value));

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env");
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
};

const validateRazorpayCredentials = async () => {
  if (!isRazorpayConfigured()) {
    return { valid: false, reason: "Razorpay keys are not configured" };
  }

  try {
    const razorpay = getRazorpay();
    await razorpay.orders.create({
      amount: 100,
      currency: "INR",
      receipt: "credential-test",
      payment_capture: 1
    });
    return { valid: true };
  } catch (error) {
    const reason = error?.error?.description || error?.message || "Unknown Razorpay error";
    return { valid: false, reason };
  }
};

const isRazorpayConfigured = () =>
  isRealValue(process.env.RAZORPAY_KEY_ID) && isRealValue(process.env.RAZORPAY_KEY_SECRET);

const getPublicRazorpayKey = () => {
  if (!process.env.RAZORPAY_KEY_ID) {
    throw new Error("RAZORPAY_KEY_ID is not configured");
  }
  return process.env.RAZORPAY_KEY_ID;
};

module.exports = {
  getRazorpay,
  validateRazorpayCredentials,
  isRazorpayConfigured,
  getPublicRazorpayKey
};
