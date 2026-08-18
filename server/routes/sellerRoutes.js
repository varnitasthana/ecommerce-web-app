const express = require("express");
const { createApplication, getApplications, updateApplicationStatus } = require("../controllers/sellerController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/applications", createApplication);
router.get("/applications", protect, adminOnly, getApplications);
router.patch("/applications/:id", protect, adminOnly, updateApplicationStatus);

module.exports = router;