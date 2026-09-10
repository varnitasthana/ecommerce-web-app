const express = require("express");
const { getCompareProducts } = require("../controllers/compareController");

const router = express.Router();

router.post("/", getCompareProducts);

module.exports = router;
