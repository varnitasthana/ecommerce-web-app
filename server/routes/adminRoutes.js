const express = require("express");
const { getOverview } = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/overview", protect, adminOnly, getOverview);

module.exports = router;
