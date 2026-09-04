const Product = require("../models/Product");
const User = require("../models/User");
const Order = require("../models/Order");
const SellerApplication = require("../models/SellerApplication");

const getOverview = async (req, res) => {
  try {
    const [customers, sellers, products, activeProducts, orders, pendingOrders, applications, lowStock] = await Promise.all([
      User.countDocuments({ role: "customer", isDeleted: false }),
      User.countDocuments({ role: "seller", isDeleted: false }),
      Product.countDocuments({ deleted: false }),
      Product.countDocuments({ active: true, deleted: false }),
      Order.countDocuments(),
      Order.countDocuments({ status: "pending_payment" }),
      SellerApplication.countDocuments({ status: "pending" }),
      Product.countDocuments({ active: true, deleted: false, stock: { $gt: 0, $lte: 10 } })
    ]);

    res.status(200).json({
      customers,
      sellers,
      products,
      activeProducts,
      orders,
      pendingOrders,
      pendingSellerApplications: applications,
      lowStockProducts: lowStock
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to load admin overview" });
  }
};

module.exports = { getOverview };
