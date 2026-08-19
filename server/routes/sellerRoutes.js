const express = require("express");
const { createApplication, getApplications, updateApplicationStatus, getMyApplications } = require("../controllers/sellerController");
const { protect, adminOnly, sellerOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/applications", createApplication);
router.get("/my-applications", protect, sellerOnly, getMyApplications);
router.get("/applications", protect, adminOnly, getApplications);
router.patch("/applications/:id", protect, adminOnly, updateApplicationStatus);

module.exports = router;