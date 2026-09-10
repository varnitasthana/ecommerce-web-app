const User = require("../models/User");
const Product = require("../models/Product");

const getRecentlyViewed = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const recentlyViewed = user.recentlyViewed || [];
    const products = await Product.find({ _id: { $in: recentlyViewed }, active: true, deleted: false }).limit(10).lean();

    res.status(200).json({ products });
  } catch (error) {
    res.status(500).json({ message: "Unable to load recently viewed" });
  }
};

const addRecentlyViewed = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: "Product ID is required" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const viewed = user.recentlyViewed || [];
    const filtered = viewed.filter((id) => String(id) !== String(productId));
    filtered.unshift(productId);
    user.recentlyViewed = filtered.slice(0, 20);
    await user.save();

    res.status(200).json({ message: "Added to recently viewed" });
  } catch (error) {
    res.status(500).json({ message: "Unable to add recently viewed" });
  }
};

module.exports = { getRecentlyViewed, addRecentlyViewed };
