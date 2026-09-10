const Razorpay = require("razorpay");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { getRazorpay } = require("../config/razorpay");

const processRefund = async (orderId, reason = null) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw Object.assign(
      new Error("Order not found"),
      { statusCode: 404 }
    );
  }

  if (order.paymentStatus !== "paid") {
    throw Object.assign(
      new Error("Can only refund orders with paid status"),
      { statusCode: 400 }
    );
  }

  if (order.refundStatus === "approved" || order.refundStatus === "processed") {
    throw Object.assign(
      new Error("Order already has a refund in progress or completed"),
      { statusCode: 400 }
    );
  }

  if (!order.razorpayPaymentId) {
    throw Object.assign(
      new Error("Order has no Razorpay payment ID for refund"),
      { statusCode: 400 }
    );
  }

  try {
    const razorpay = getRazorpay();
    const refund = await razorpay.refunds.create({
      payment_id: order.razorpayPaymentId,
      amount: Math.round(order.total * 100),
      notes: {
        reason: reason || "Customer requested refund"
      }
    });

    order.refundStatus = "processed";
    order.refundAmount = order.total;
    order.refundProcessedAt = new Date();
    order.paymentStatus = "refunded";
    order.refundReason = reason || "Customer requested refund";

    await order.save();

    return {
      orderId: order._id,
      refundId: refund.id,
      amount: order.total,
      status: "processed"
    };
  } catch (error) {
    console.error("Razorpay refund error:", error.message);
    throw Object.assign(
      new Error(`Refund failed: ${error.message}`),
      { statusCode: 502 }
    );
  }
};

const releaseReservedStock = async (order) => {
  if (!order.stockReserved) return;

  try {
    const updateOps = order.items.map((item) =>
      Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } }
      )
    );

    await Promise.all(updateOps);
    order.stockReserved = false;
    await order.save();
  } catch (error) {
    console.error("Stock release error:", error.message);
    throw error;
  }
};

module.exports = {
  processRefund,
  releaseReservedStock
};
