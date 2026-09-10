const express = require("express");

const {
  registerUser,
  loginUser,
  refreshToken
} = require("../controllers/authController");
const { getCurrentUser } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const rateLimit = require("express-rate-limit");

const router = express.Router();
const isTest = process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined;
const authLimiter = isTest
  ? (req, res, next) => next()
  : rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.post("/refresh-token", refreshToken);
router.get("/me", protect, getCurrentUser);

module.exports = router;
