const Order = require("../models/Order");
const Product = require("../models/Product");
const { getTracking } = require("../services/shippingService");
const { processRefund, releaseReservedStock } = require("../services/refundService");

const normaliseItems = (items) => {
  const quantities = new Map();

  for (const item of items) {
    const productId = String(item?.product || "");
    const quantity = Number(item?.quantity);
    if (!productId || !Number.isInteger(quantity) || quantity < 1) {
      throw Object.assign(new Error("Each item needs a valid product and quantity"), { statusCode: 400 });
    }
    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }

  return [...quantities.entries()].map(([product, quantity]) => ({ product, quantity }));
};

const reserveStock = async (items) => {
  const reserved = [];

  try {
    for (const item of items) {
      const product = await Product.findOneAndUpdate(
        { _id: item.product, active: true, deleted: false, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { returnDocument: "after" }
      );

      if (!product) {
        throw Object.assign(new Error("One or more products are unavailable or out of stock"), { statusCode: 400 });
      }

      reserved.push({ product, quantity: item.quantity });
    }
    return reserved;
  } catch (error) {
    await Promise.all(reserved.map(({ product, quantity }) => Product.findByIdAndUpdate(product._id, { $inc: { stock: quantity } })));
    throw error;
  }
};

const createOrder = async (req, res) => {
  const idempotencyKey = String(req.get("Idempotency-Key") || "").trim();

  try {
    const { items, shippingAddress } = req.body;

    if (!Array.isArray(items) || items.length === 0 || !shippingAddress) {
      return res.status(400).json({ message: "Items and shipping address are required" });
    }

    if (idempotencyKey.length > 100) return res.status(400).json({ message: "Idempotency-Key is too long" });
    if (idempotencyKey) {
      const existing = await Order.findOne({ user: req.user.id, idempotencyKey });
      if (existing) return res.status(200).json({ message: "Order already created", order: existing, idempotent: true });
    }

    const requestedItems = normaliseItems(items);
    const reserved = await reserveStock(requestedItems);
    const orderItems = reserved.map(({ product, quantity }) => ({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity,
      sku: product.sku || null
    }));

    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let order;

    try {
      order = await Order.create({
        user: req.user.id,
        idempotencyKey: idempotencyKey || undefined,
        items: orderItems,
        shippingAddress,
        subtotal,
        total: subtotal,
        status: "pending_payment"
      });
    } catch (error) {
      await Promise.all(reserved.map(({ product, quantity }) => Product.findByIdAndUpdate(product._id, { $inc: { stock: quantity } })));
      throw error;
    }

    res.status(201).json({ message: "Order created successfully", order });
  } catch (error) {
    res.status(error.statusCode || 400).json({ message: error.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const status = req.query.status;

    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 50) {
      return res.status(400).json({ message: "Page and limit must be valid numbers" });
    }

    const query = { user: req.user.id };
    if (status && ["pending_payment", "confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"].includes(status)) {
      query.status = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("items.product", "name image")
        .lean(),
      Order.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      orders,
      pagination: { page, limit, total, totalPages }
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to load orders" });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate("items.product", "name image sku price");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: "Unable to load order" });
  }
};

const getOrderTracking = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!order.trackingNumber) return res.status(409).json({ message: "Tracking is not available yet" });

    const tracking = await getTracking(order.trackingNumber);
    res.status(200).json(tracking);
  } catch (error) {
    res.status(error.statusCode || 502).json({ message: error.message });
  }
};

const requestRefund = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentStatus !== "paid") {
      return res.status(400).json({ message: "Only paid orders can be refunded" });
    }

    if (order.refundStatus !== "none") {
      return res.status(400).json({ message: "A refund is already in progress or completed for this order" });
    }

    try {
      const refundResult = await processRefund(order._id, reason);
      res.status(200).json({
        message: "Refund processed successfully",
        refund: refundResult
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({ message: error.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Unable to process refund" });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!["pending_payment", "confirmed", "processing"].includes(order.status)) {
      return res.status(400).json({ 
        message: "Order cannot be cancelled in current status",
        currentStatus: order.status
      });
    }

    order.status = "cancelled";
    order.cancelledReason = reason || "Customer requested cancellation";
    order.cancelledAt = new Date();

    if (order.paymentStatus === "paid" && !order.refundStatus) {
      try {
        await processRefund(order._id, reason);
      } catch (error) {
        console.error("Automatic refund failed:", error.message);
        order.refundStatus = "pending";
      }
    }

    if (order.stockReserved) {
      await releaseReservedStock(order);
    }

    await order.save();

    res.status(200).json({
      message: "Order cancelled successfully",
      order
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

module.exports = { 
  createOrder, 
  getMyOrders, 
  getOrderById,
  getOrderTracking, 
  requestRefund,
  cancelOrder
};