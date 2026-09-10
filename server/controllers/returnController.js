const Return = require("../models/Return");
const Order = require("../models/Order");
const { releaseReservedStock } = require("../services/refundService");

const createReturn = async (req, res) => {
  try {
    const { orderId, items, reason } = req.body;
    const order = await Order.findOne({ _id: orderId, user: req.user.id });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!["delivered"].includes(order.status)) return res.status(400).json({ message: "Only delivered orders can be returned" });
    if (order.paymentStatus !== "paid") return res.status(400).json({ message: "Only paid orders can be returned" });

    const existingReturn = await Return.findOne({ order: orderId, status: { $nin: ["rejected", "completed"] } });
    if (existingReturn) return res.status(400).json({ message: "A return request is already in progress for this order" });

    const returnRequest = await Return.create({
      order: orderId,
      user: req.user.id,
      items,
      reason
    });

    order.status = "return_requested";
    await order.save();

    res.status(201).json({ message: "Return request submitted successfully", return: returnRequest });
  } catch (error) {
    res.status(500).json({ message: "Unable to submit return request" });
  }
};

const getMyReturns = async (req, res) => {
  try {
    const returns = await Return.find({ user: req.user.id }).sort({ createdAt: -1 }).populate("order", "_id createdAt total status");
    res.status(200).json({ returns });
  } catch (error) {
    res.status(500).json({ message: "Unable to load returns" });
  }
};

const getAllReturns = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const [returns, total] = await Promise.all([
      Return.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("user", "name email").populate("order", "_id total status").populate("processedBy", "name email"),
      Return.countDocuments()
    ]);
    res.status(200).json({ returns, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ message: "Unable to load returns" });
  }
};

const updateReturnStatus = async (req, res) => {
  try {
    const { status, notes, refundAmount } = req.body;
    const returnRequest = await Return.findById(req.params.id);
    if (!returnRequest) return res.status(404).json({ message: "Return not found" });

    if (!["approved", "rejected", "processed", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    returnRequest.status = status;
    if (notes) returnRequest.notes = notes;
    if (refundAmount !== undefined) returnRequest.refundAmount = refundAmount;
    if (status !== "pending") {
      returnRequest.processedBy = req.user.id;
      returnRequest.processedAt = new Date();
    }

    await returnRequest.save();

    const order = await Order.findById(returnRequest.order);
    if (order) {
      if (status === "approved") order.status = "return_approved";
      else if (status === "rejected") order.status = "delivered";
      else if (status === "completed") {
        order.status = "returned";
        order.paymentStatus = "refunded";
        await releaseReservedStock(order);
      }
      await order.save();
    }

    res.status(200).json({ message: "Return status updated", return: returnRequest });
  } catch (error) {
    res.status(500).json({ message: "Unable to update return status" });
  }
};

module.exports = { createReturn, getMyReturns, getAllReturns, updateReturnStatus };
