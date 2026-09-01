const express = require("express");

const {
  getProducts,
  getProductById,
  getCatalogFacets,
  createProduct,
  updateProduct,
  deleteProduct
} = require("../controllers/productController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getProducts);
router.get("/facets", getCatalogFacets);
router.get("/:id", getProductById);
router.post("/", protect, adminOnly, createProduct);
router.put("/:id", protect, adminOnly, updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

module.exports = router;
