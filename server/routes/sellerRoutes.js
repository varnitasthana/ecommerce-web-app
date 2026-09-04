const express = require("express");
const {
	createApplication,
	getApplications,
	updateApplicationStatus,
	getMyApplications,
	getSellerProducts,
	createSellerProduct,
	updateSellerProduct,
	deleteSellerProduct
} = require("../controllers/sellerController");
const { protect, adminOnly, sellerOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/applications", createApplication);
router.get("/my-applications", protect, sellerOnly, getMyApplications);
router.get("/applications", protect, adminOnly, getApplications);
router.patch("/applications/:id", protect, adminOnly, updateApplicationStatus);
router.get("/products", protect, sellerOnly, getSellerProducts);
router.post("/products", protect, sellerOnly, createSellerProduct);
router.put("/products/:id", protect, sellerOnly, updateSellerProduct);
router.delete("/products/:id", protect, sellerOnly, deleteSellerProduct);

module.exports = router;