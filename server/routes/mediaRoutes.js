const express = require("express");
const { createUploadSignature } = require("../controllers/mediaController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/signature", protect, adminOnly, createUploadSignature);

module.exports = router;
