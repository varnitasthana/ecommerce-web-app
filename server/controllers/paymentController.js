const crypto = require("crypto");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { getRazorpay, isRazorpayConfigured } = require("../config/razorpay");
const { sendOrderConfirmation } = require("../services/emailService");
const { releaseReservedStock } = require("../services/refundService");

const normaliseItems = (items) => {
  const quantities = new Map();

  for (const item of items) {
    const quantity = Number(item.quantity);
    if (!item.product || !Number.isInteger(quantity) || quantity < 1) {
      throw new Error("Each item needs a valid product and quantity");
    }
    quantities.set(item.product, (quantities.get(item.product) || 0) + quantity);
  }

  return [...quantities.entries()].map(([product, quantity]) => ({ product, quantity }));
};

const validateProductsAndPrices = async (requestedItems) => {
  const productIds = requestedItems.map((item) => item.product);
  const products = await Product.find({ _id: { $in: productIds }, active: true, deleted: false });

  if (products.length !== productIds.length) {
    throw Object.assign(
      new Error("One or more products no longer exist or are unavailable"),
      { statusCode: 400 }
    );
  }

  const productMap = new Map(products.map((p) => [p._id.toString(), p]));
  const validated = [];

  for (const item of requestedItems) {
    const product = productMap.get(item.product.toString());
    if (!product) {
      throw Object.assign(
        new Error(`Product ${item.product} not found or inactive`),
        { statusCode: 400 }
      );
    }
    if (product.stock < item.quantity) {
      throw Object.assign(
        new Error(`Insufficient stock for ${product.name}`),
        { statusCode: 400 }
      );
    }
    validated.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      sku: product.sku
    });
  }

  return validated;
};

const reserveStock = async (validatedItems) => {
  const reserved = [];

  try {
    for (const item of validatedItems) {
      const product = await Product.findOneAndUpdate(
        { _id: item.productId, active: true, deleted: false, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { returnDocument: "after" }
      );

      if (!product) {
        throw Object.assign(
          new Error(`Product ${item.productId} has insufficient stock or is unavailable`),
          { statusCode: 400 }
        );
      }

      reserved.push(item);
    }
    return reserved;
  } catch (error) {
    await Promise.all(
      reserved.map((item) =>
        Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } })
      )
    );
    throw error;
  }
};

const createNotification = async (userId, title, message, type = "order", data = {}) => {
  try {
    await Notification.create({ user: userId, title, message, type, data });
  } catch (error) {
    console.error("Notification creation failed:", error.message);
  }
};

const createRazorpayOrder = async (req, res) => {
  let order = null;
  let reserved = [];

  try {
    const { items, shippingAddress, email, phone, addressId } = req.body;
    const idempotencyKey = String(req.get("Idempotency-Key") || "").trim();
    const completeAddress = shippingAddress?.name && shippingAddress?.street && shippingAddress?.city && shippingAddress?.postalCode && shippingAddress?.country;

    if (!Array.isArray(items) || items.length === 0 || !completeAddress) {
      return res.status(400).json({ message: "Items and complete shipping address are required" });
    }

    if (!req.user && !email) {
      return res.status(400).json({ message: "Email is required for guest checkout" });
    }

    if (idempotencyKey.length > 100) return res.status(400).json({ message: "Idempotency-Key is too long" });
    if (idempotencyKey) {
      const existingQuery = req.user ? { user: req.user.id, idempotencyKey } : { guestEmail: email, idempotencyKey };
      const existing = await Order.findOne(existingQuery);
      if (existing) return res.status(200).json({ message: "Order already created", order: existing, idempotent: true });
    }

    const requestedItems = normaliseItems(items);
    const validatedItems = await validateProductsAndPrices(requestedItems);
    reserved = await reserveStock(validatedItems);

    const orderItems = reserved.map((item) => ({
      product: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));

    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal >= 999 ? 0 : 49;
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + shipping + tax;

    const orderPayload = {
      ...(req.user ? { user: req.user.id } : {}),
      ...(email ? { guestEmail: email } : {}),
      ...(phone ? { guestPhone: phone } : {}),
      ...(idempotencyKey ? { idempotencyKey } : {}),
      ...(addressId ? { addressId } : {}),
      items: orderItems,
      shippingAddress,
      subtotal,
      shippingCost: shipping,
      taxAmount: tax,
      total,
      status: "pending_payment",
      paymentStatus: "pending",
      paymentMethod: "razorpay",
      stockReserved: true
    };

    order = await Order.create(orderPayload);

    const razorpay = getRazorpay();

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: "INR",
      receipt: order._id.toString(),
      payment_capture: 1
    });

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    const user = await User.findById(req.user.id).select("email");

    res.status(201).json({
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      amount: Math.round(total * 100),
      currency: "INR",
      orderId: order._id,
      userEmail: email || user?.email || null
    });
  } catch (error) {
    const statusCode = error?.statusCode || 400;
    const rawDescription = error?.error?.description || error?.message || "Unable to create payment order. Please try again.";
    const isRazorpayAuthError = /authentication failed/i.test(rawDescription);
    const message = isRazorpayAuthError
      ? "Payment provider authentication failed. Please contact support or try Cash on Delivery."
      : rawDescription;

    console.error("Create Razorpay order failed:", {
      message,
      statusCode,
      errorCode: error?.error?.code,
      errorDescription: error?.error?.description,
      errorField: error?.error?.field,
      raw: error
    });

    if (order?._id) {
      try {
        await Order.findByIdAndDelete(order._id);
      } catch (cleanupError) {
        console.error("Razorpay order cleanup error:", cleanupError.message);
      }
    }

    if (reserved.length > 0) {
      try {
        await Promise.all(
          reserved.map((item) =>
            Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } })
          )
        );
      } catch (releaseError) {
        console.error("Stock release error:", releaseError.message);
      }
    }

    res.status(statusCode).json({ message, code: isRazorpayAuthError ? "RAZORPAY_AUTH_FAILED" : "CREATE_ORDER_FAILED" });
  }
};

const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing Razorpay payment verification fields" });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment signature verification failed" });
    }

    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) {
      return res.status(404).json({ message: "Order not found for this payment" });
    }

    if (order.paymentStatus === "paid") {
      return res.status(200).json({ message: "Payment already verified", orderId: order._id, order });
    }

    order.paymentStatus = "paid";
    order.status = "confirmed";
    order.paidAt = new Date();
    order.razorpayPaymentId = razorpay_payment_id;
    order.stockReserved = false;

    await order.save();

    const user = await User.findById(order.user).select("email");
    if (user?.email) {
      sendOrderConfirmation({ email: user.email, order }).catch((error) =>
        console.error("Order email failed:", error.message)
      );
      createNotification(order.user, "Payment Successful", `Your payment of ₹${order.total} was successful. Order #${order._id.toString().slice(-8).toUpperCase()} is confirmed.`, "payment", { orderId: order._id }).catch(() => {});
    }

    res.status(200).json({ message: "Payment verified successfully", orderId: order._id, order });
  } catch (error) {
    const message = error?.message || "Payment verification failed";
    res.status(500).json({ message });
  }
};

const handleRazorpayWebhook = async (req, res) => {
  try {
    const razorpaySignature = req.headers["x-razorpay-signature"];
    if (!razorpaySignature) {
      return res.status(400).json({ message: "Missing Razorpay signature" });
    }

    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      return res.status(500).json({ message: "Razorpay webhook secret is not configured" });
    }
    if (!req.body || typeof req.body.toString !== "function") {
      return res.status(400).json({ message: "Invalid webhook payload" });
    }

    const bodyString = req.body.toString();

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(bodyString)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    let event;
    try {
      event = JSON.parse(bodyString);
    } catch {
      return res.status(400).json({ message: "Invalid webhook payload" });
    }

    const eventType = event.event;
    const paymentEntity = event.payload?.payment?.entity || event.payload?.order?.entity;

    if (!paymentEntity) {
      return res.json({ received: true });
    }

    const razorpayOrderId = paymentEntity.order_id;
    if (!razorpayOrderId) {
      return res.json({ received: true });
    }

    const order = await Order.findOne({ razorpayOrderId });
    if (!order) {
      return res.json({ received: true });
    }

    const user = await User.findById(order.user).select("email");

    if (eventType === "payment.captured") {
      if (order.paymentStatus !== "pending") {
        return res.json({ received: true, idempotent: true });
      }

      order.paymentStatus = "paid";
      order.status = "confirmed";
      order.paidAt = new Date();
      order.razorpayPaymentId = paymentEntity.id;
      order.stockReserved = false;

      await order.save();

      if (user?.email) {
        sendOrderConfirmation({ email: user.email, order }).catch((error) =>
          console.error("Order email failed:", error.message)
        );
        createNotification(order.user, "Order Confirmed", `Your order #${order._id.toString().slice(-8).toUpperCase()} is confirmed and will be shipped soon.`, "order", { orderId: order._id }).catch(() => {});
      }
    } else if (eventType === "payment.failed") {
      if (order.paymentStatus !== "pending") {
        return res.json({ received: true, idempotent: true });
      }

      await releaseReservedStock(order);
      order.paymentStatus = "failed";
      order.status = "cancelled";

      await order.save();
    } else if (eventType === "refund.processed") {
      if (order.refundStatus === "processed") {
        return res.json({ received: true, idempotent: true });
      }

      order.refundStatus = "processed";
      order.refundProcessedAt = new Date();
      order.paymentStatus = "refunded";

      await order.save();
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Razorpay webhook processing error:", error.message);
    res.status(500).json({ received: false, error: error.message });
  }
};

const createDemoCheckoutSession = async (req, res) => {
  let order = null;
  let reserved = [];

  try {
    const { items, shippingAddress, paymentMethod = "cod", addressId } = req.body;
    const idempotencyKey = String(req.get("Idempotency-Key") || "").trim();

    if (!Array.isArray(items) || items.length === 0 || !shippingAddress?.name || !shippingAddress?.street || !shippingAddress?.city || !shippingAddress?.postalCode || !shippingAddress?.country) {
      return res.status(400).json({ message: "Items and complete shipping address are required" });
    }

    if (idempotencyKey.length > 100) return res.status(400).json({ message: "Idempotency-Key is too long" });
    if (idempotencyKey) {
      const existing = await Order.findOne({ user: req.user.id, idempotencyKey });
      if (existing) return res.status(200).json({ message: "Order already created", order: existing, idempotent: true });
    }

    const requestedItems = normaliseItems(items);
    const validatedItems = await validateProductsAndPrices(requestedItems);
    reserved = await reserveStock(validatedItems);

    const orderItems = reserved.map((item) => ({
      product: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      sku: item.sku
    }));

    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal >= 999 ? 0 : 49;
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + shipping + tax;

    order = await Order.create({
      user: req.user.id,
      ...(idempotencyKey ? { idempotencyKey } : {}),
      ...(addressId ? { addressId } : {}),
      items: orderItems,
      shippingAddress,
      subtotal,
      shippingCost: shipping,
      taxAmount: tax,
      total,
      status: "confirmed",
      paymentStatus: "paid",
      paymentMethod: paymentMethod || "cod",
      stockReserved: false
    });

    createNotification(req.user.id, "Order Placed", `Your order #${order._id.toString().slice(-8).toUpperCase()} has been placed successfully with ${paymentMethod === 'cod' ? 'Cash on Delivery' : 'online payment'}.`, "order", { orderId: order._id }).catch(() => {});

    res.status(201).json({ orderId: order._id, demo: true, paymentMethod: paymentMethod || "cod" });
  } catch (error) {
    const message = error?.message || "Unable to create demo checkout session. Please try again.";

    if (order?._id) {
      try {
        await Order.findByIdAndDelete(order._id);
      } catch (cleanupError) {
        console.error("Demo checkout cleanup error:", cleanupError.message);
      }
    }

    if (reserved.length > 0) {
      try {
        await Promise.all(
          reserved.map((item) =>
            Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } })
          )
        );
      } catch (releaseError) {
        console.error("Stock release error:", releaseError.message);
      }
    }

    res.status(error?.statusCode || 400).json({ message });
  }
};

module.exports = {
  createRazorpayOrder: createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayWebhook,
  createDemoCheckoutSession
};
