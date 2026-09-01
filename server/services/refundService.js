const Stripe = require("stripe");
const Order = require("../models/Order");
const Product = require("../models/Product");

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

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

  if (!order.stripePaymentIntentId) {
    throw Object.assign(
      new Error("Order has no payment intent ID for refund"),
      { statusCode: 400 }
    );
  }

  try {
    const stripe = getStripe();
    const refund = await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
      amount: Math.round(order.total * 100),
      reason: "requested_by_customer"
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
    console.error("Stripe refund error:", error.message);
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
