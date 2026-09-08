const Stripe = require("stripe");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const { sendOrderConfirmation } = require("../services/emailService");

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured. Add STRIPE_SECRET_KEY to server/.env");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

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

const reserveStockWithinTransaction = async (session, validatedItems) => {
  const reserved = [];

  try {
    for (const item of validatedItems) {
      const product = await Product.findOneAndUpdate(
        { _id: item.productId, stock: { $gte: item.quantity }, active: true, deleted: false },
        { $inc: { stock: -item.quantity } },
        { returnDocument: "after", session }
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
    throw error;
  }
};

const releaseOrderStock = async (order, session = null) => {
  if (!order.stockReserved) return;
  
  const updateOps = order.items.map((item) =>
    Product.findByIdAndUpdate(
      item.product,
      { $inc: { stock: item.quantity } },
      { session }
    )
  );
  
  await Promise.all(updateOps);
  order.stockReserved = false;
};

const createCheckoutSession = async (req, res) => {
  let session = null;
  let order = null;

  try {
    const { items, shippingAddress } = req.body;
    const completeAddress = shippingAddress?.name && shippingAddress?.street && shippingAddress?.city && shippingAddress?.postalCode && shippingAddress?.country;
    
    if (!Array.isArray(items) || items.length === 0 || !completeAddress) {
      return res.status(400).json({ message: "Items and complete shipping address are required" });
    }

    const requestedItems = normaliseItems(items);
    const validatedItems = await validateProductsAndPrices(requestedItems);
    
    session = await mongoose.startSession();
    session.startTransaction();

    const reserved = await reserveStockWithinTransaction(session, validatedItems);
    const orderItems = reserved.map((item) => ({
      product: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));
    
    const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    order = await Order.create([{
      user: req.user.id,
      items: orderItems,
      shippingAddress,
      total,
      status: "pending_payment",
      paymentStatus: "pending",
      stockReserved: true
    }], { session });

    const user = await User.findById(req.user.id).select("email");
    const stripe = getStripe();
    
    const session_obj = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: orderItems.map((item) => ({
        price_data: {
          currency: process.env.STRIPE_CURRENCY || "inr",
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100)
        },
        quantity: item.quantity
      })),
      ...(user?.email ? { customer_email: user.email } : {}),
      metadata: { orderId: order[0]._id.toString() },
      success_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/orders?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/checkout?payment=cancelled`
    });

    order[0].stripeCheckoutSessionId = session_obj.id;
    await order[0].save({ session });

    await session.commitTransaction();
    
    res.status(201).json({ checkoutUrl: session_obj.url, orderId: order[0]._id });
  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }
    
    if (order && Array.isArray(order) && order[0]?._id) {
      try {
        await Order.findByIdAndDelete(order[0]._id);
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError.message);
      }
    }
    
    res.status(error.statusCode || 400).json({ message: error.message });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

const handleStripeWebhook = async (req, res) => {
  let event;
  let webhookProcessedRecord = null;

  try {
    const stripe = getStripe();
    if (!process.env.STRIPE_WEBHOOK_SECRET) throw new Error("Stripe webhook secret is not configured");
    event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error("Webhook signature error:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  const eventId = event.id;
  const eventType = event.type;
  
  try {
    const session_obj = event.data.object;
    const orderId = session_obj.metadata?.orderId;
    
    if (!orderId) {
      console.warn(`Webhook ${eventId} (${eventType}): No orderId in metadata`);
      return res.json({ received: true });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      console.warn(`Webhook ${eventId} (${eventType}): Order ${orderId} not found`);
      return res.json({ received: true });
    }

    const user = await User.findById(order.user).select("email");

    if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(eventType) && session_obj.payment_status === "paid") {
      if (order.paymentStatus !== "pending") {
        console.info(`Webhook ${eventId}: Order ${orderId} already processed (status: ${order.paymentStatus})`);
        return res.json({ received: true, idempotent: true });
      }

      order.paymentStatus = "paid";
      order.status = "confirmed";
      order.paidAt = new Date();
      order.stripePaymentIntentId = session_obj.payment_intent;
      order.stripeCheckoutSessionId = session_obj.id;
      order.stockReserved = false;
      
      await order.save();
      
      if (user?.email) {
        sendOrderConfirmation({ email: user.email, order }).catch((error) => 
          console.error("Order email failed:", error.message)
        );
      }
      
      console.info(`Webhook ${eventId}: Order ${orderId} payment confirmed`);
    } else if (["checkout.session.expired", "checkout.session.async_payment_failed"].includes(eventType)) {
      if (order.paymentStatus !== "pending") {
        console.info(`Webhook ${eventId}: Order ${orderId} already processed (status: ${order.paymentStatus})`);
        return res.json({ received: true, idempotent: true });
      }

      await releaseOrderStock(order);
      order.paymentStatus = "failed";
      order.status = "cancelled";
      
      await order.save();
      
      console.info(`Webhook ${eventId}: Order ${orderId} payment failed/expired`);
    } else {
      console.debug(`Webhook ${eventId}: Unhandled event type ${eventType}`);
    }

    return res.json({ received: true });
  } catch (error) {
    console.error(`Webhook ${eventId} processing error:`, error.message);
    return res.status(500).json({ received: false, error: error.message });
  }
};

const getCheckoutSession = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ message: "session_id is required" });

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const orderId = session.metadata?.orderId;

    if (!orderId) return res.status(404).json({ message: "Order not found for this session" });

    res.status(200).json({ orderId, session });
  } catch (error) {
    res.status(500).json({ message: "Unable to retrieve checkout session" });
  }
};

const createDemoCheckoutSession = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod = "demo" } = req.body;

    if (!Array.isArray(items) || items.length === 0 || !shippingAddress?.name || !shippingAddress?.street || !shippingAddress?.city || !shippingAddress?.postalCode || !shippingAddress?.country) {
      return res.status(400).json({ message: "Items and complete shipping address are required" });
    }

    const requestedItems = normaliseItems(items);
    const validatedItems = await validateProductsAndPrices(requestedItems);

    const orderItems = validatedItems.map((item) => ({
      product: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      sku: item.sku
    }));

    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal > 999 ? 0 : 49;
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + shipping + tax;

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      shippingAddress,
      subtotal,
      shippingCost: shipping,
      taxAmount: tax,
      total,
      status: "confirmed",
      paymentStatus: "paid",
      paymentMethod: paymentMethod,
      stockReserved: false
    });

    res.status(201).json({ orderId: order._id, demo: true, paymentMethod });
  } catch (error) {
    res.status(error.statusCode || 400).json({ message: error.message });
  }
};

module.exports = { createCheckoutSession, handleStripeWebhook, getCheckoutSession, createDemoCheckoutSession };
