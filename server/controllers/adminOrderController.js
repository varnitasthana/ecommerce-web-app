const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

const getAllOrders = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const status = req.query.status;
    const paymentStatus = req.query.paymentStatus;

    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("user", "name email").populate("items.product", "name image sku"),
      Order.countDocuments(query)
    ]);

    res.status(200).json({ orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ message: "Unable to load orders" });
  }
};

const getOrderByIdAdmin = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email").populate("items.product", "name image sku price");
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: "Unable to load order" });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber, trackingUrl, notes } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const allowedStatuses = ["confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"];
    if (!allowedStatuses.includes(status)) return res.status(400).json({ message: "Invalid status" });

    order.status = status;
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber || null;
    if (trackingUrl !== undefined) order.trackingUrl = trackingUrl || null;
    if (notes !== undefined) order.notes = notes;

    if (status === "shipped") order.shippedAt = new Date();
    if (status === "delivered") order.deliveredAt = new Date();

    await order.save();
    res.status(200).json({ message: "Order status updated", order });
  } catch (error) {
    res.status(500).json({ message: "Unable to update order status" });
  }
};

const bulkUpdateOrderStatus = async (req, res) => {
  try {
    const { orderIds, status, trackingNumber } = req.body;
    if (!Array.isArray(orderIds) || orderIds.length === 0) return res.status(400).json({ message: "Order IDs are required" });
    if (!status) return res.status(400).json({ message: "Status is required" });

    const updatePayload = { status };
    if (status === "shipped") {
      updatePayload.shippedAt = new Date();
      if (trackingNumber) updatePayload.trackingNumber = trackingNumber;
    }
    if (status === "delivered") updatePayload.deliveredAt = new Date();

    await Order.updateMany({ _id: { $in: orderIds } }, updatePayload);
    res.status(200).json({ message: `${orderIds.length} orders updated successfully` });
  } catch (error) {
    res.status(500).json({ message: "Unable to bulk update orders" });
  }
};

module.exports = { getAllOrders, getOrderByIdAdmin, updateOrderStatus, bulkUpdateOrderStatus };
