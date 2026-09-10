const Order = require("../models/Order");
const Product = require("../models/Product");

const getSellerAnalytics = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalOrders, totalRevenue, recentOrders, topProducts, lowStock, statusBreakdown] = await Promise.all([
      Order.countDocuments({ seller: sellerId }),
      Order.aggregate([
        { $match: { seller: sellerId, paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$total" } } }
      ]),
      Order.find({ seller: sellerId }).sort({ createdAt: -1 }).limit(10).populate("items.product", "name image"),
      Product.find({ seller: sellerId, active: true, deleted: false }).sort({ purchases: -1 }).limit(5).select("name price stock purchases rating"),
      Product.find({ seller: sellerId, active: true, deleted: false, stock: { $lte: 10 } }).select("name stock"),
      Order.aggregate([
        { $match: { seller: sellerId } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ])
    ]);

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;
    const statusMap = Object.fromEntries(statusBreakdown.map((s) => [s._id, s.count]));

    res.status(200).json({
      totalOrders,
      totalRevenue: Math.round(revenue * 100) / 100,
      recentOrders,
      topProducts,
      lowStock,
      statusBreakdown: statusMap
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to load analytics" });
  }
};

module.exports = { getSellerAnalytics };
