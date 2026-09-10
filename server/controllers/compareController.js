const Product = require("../models/Product");

const getCompareProducts = async (req, res) => {
  try {
    const productIds = Array.isArray(req.body.productIds) ? req.body.productIds.slice(0, 4) : [];
    if (productIds.length < 2) return res.status(400).json({ message: "At least 2 products are required for comparison" });

    const products = await Product.find({ _id: { $in: productIds }, active: true, deleted: false }).lean();
    if (products.length < 2) return res.status(404).json({ message: "Not enough valid products to compare" });

    res.status(200).json({ products: products.map(p => ({ ...p, discountPercent: p.compareAtPrice ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100) : 0 })) });
  } catch (error) {
    res.status(500).json({ message: "Unable to compare products" });
  }
};

module.exports = { getCompareProducts };
