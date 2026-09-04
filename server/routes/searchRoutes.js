const express = require("express");
const { searchProducts, getProductsByCategory, getProductsByBrand, getSearchSuggestions } = require("../controllers/searchController");

const router = express.Router();

router.get("/", searchProducts);
router.get("/suggestions", getSearchSuggestions);
router.get("/category/:category", getProductsByCategory);
router.get("/brand/:brand", getProductsByBrand);

module.exports = router;
