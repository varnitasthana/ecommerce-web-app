const Product = require("../models/Product");
const Wishlist = require("../models/Wishlist");

const getWishlist = async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user.id }).populate("products");
  res.status(200).json(wishlist?.products || []);
};

const toggleWishlist = async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user.id },
    { $setOnInsert: { user: req.user.id } },
    { returnDocument: "after", upsert: true }
  );
  const productId = product._id.toString();
  const exists = wishlist.products.some((item) => item.toString() === productId);
  wishlist.products = exists
    ? wishlist.products.filter((item) => item.toString() !== productId)
    : [...wishlist.products, product._id];
  await wishlist.save();
  res.status(200).json({ saved: !exists, products: wishlist.products });
};

const getPriceAlert = async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user.id });
  const alerts = wishlist?.priceAlerts || {};
  res.status(200).json({ enabled: !!alerts[req.params.productId] });
};

const togglePriceAlert = async (req, res) => {
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user.id },
    { $setOnInsert: { user: req.user.id } },
    { returnDocument: "after", upsert: true }
  );
  const productId = req.params.productId;
  const alerts = wishlist.priceAlerts || {};
  const enabled = !alerts[productId];
  wishlist.priceAlerts = { ...alerts, [productId]: enabled ? true : undefined };
  await wishlist.save();
  res.status(200).json({ enabled });
};

module.exports = { getWishlist, toggleWishlist, getPriceAlert, togglePriceAlert };
