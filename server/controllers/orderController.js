const Order = require("../models/Order");
const Product = require("../models/Product");

const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;

    if (!Array.isArray(items) || items.length === 0 || !shippingAddress) {
      return res.status(400).json({ message: "Items and shipping address are required" });
    }

    const productIds = items.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((product) => [product.id, product]));

    const orderItems = items.map((item) => {
      const product = productMap.get(item.product);
      const quantity = Number(item.quantity);

      if (!product) {
        throw new Error("One or more products no longer exist");
      }

      if (!Number.isInteger(quantity) || quantity < 1 || quantity > product.stock) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      return {
        product: product._id,
        name: product.name,
        price: product.price,
        quantity
      };
    });

    const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      shippingAddress,
      total
    });

    await Promise.all(
      orderItems.map((item) =>
        Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } })
      )
    );

    res.status(201).json({ message: "Order created successfully", order });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createOrder, getMyOrders };