const Stripe = require("stripe");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

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

const reserveStock = async (items) => {
  const reserved = [];

  try {
    for (const item of items) {
      const product = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!product) throw new Error("One or more products are out of stock");
      reserved.push({ product: product._id, quantity: item.quantity, data: product });
    }
    return reserved;
  } catch (error) {
    await Promise.all(reserved.map((item) => Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } })));
    throw error;
  }
};

const releaseOrderStock = async (order) => {
  if (!order.stockReserved) return;
  await Promise.all(order.items.map((item) =>
    Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } })
  ));
  order.stockReserved = false;
};

const createCheckoutSession = async (req, res) => {
  let order;

  try {
    const { items, shippingAddress } = req.body;
    const completeAddress = shippingAddress?.name && shippingAddress?.street && shippingAddress?.city && shippingAddress?.postalCode && shippingAddress?.country;
    if (!Array.isArray(items) || items.length === 0 || !completeAddress) {
      return res.status(400).json({ message: "Items and complete shipping address are required" });
    }

    const requestedItems = normaliseItems(items);
    const reserved = await reserveStock(requestedItems);
    const orderItems = reserved.map(({ data, quantity }) => ({
      product: data._id,
      name: data.name,
      price: data.price,
      quantity
    }));
    const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    order = await Order.create({
      user: req.user.id,
      items: orderItems,
      shippingAddress,
      total,
      status: "pending_payment",
      paymentStatus: "pending",
      stockReserved: true
    });

    const user = await User.findById(req.user.id).select("email");
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
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
      metadata: { orderId: order.id },
      success_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/orders?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/checkout?payment=cancelled`
    });

    order.stripeCheckoutSessionId = session.id;
    await order.save();
    res.status(201).json({ checkoutUrl: session.url, orderId: order.id });
  } catch (error) {
    if (order) {
      await releaseOrderStock(order);
      await order.save();
      await Order.findByIdAndDelete(order.id);
    }
    res.status(error.message.includes("not configured") ? 503 : 400).json({ message: error.message });
  }
};

const handleStripeWebhook = async (req, res) => {
  let event;

  try {
    const stripe = getStripe();
    if (!process.env.STRIPE_WEBHOOK_SECRET) throw new Error("Stripe webhook secret is not configured");
    event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  const session = event.data.object;
  const orderId = session.metadata?.orderId;
  if (!orderId) return res.json({ received: true });

  const order = await Order.findById(orderId);
  if (!order) return res.json({ received: true });

  if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type) && session.payment_status === "paid" && order.paymentStatus === "pending") {
    order.paymentStatus = "paid";
    order.status = "confirmed";
    order.paidAt = new Date();
    order.stripePaymentIntentId = session.payment_intent;
    order.stockReserved = false;
    await order.save();
  }

  if (["checkout.session.expired", "checkout.session.async_payment_failed"].includes(event.type) && order.paymentStatus === "pending") {
    await releaseOrderStock(order);
    order.paymentStatus = "failed";
    order.status = "cancelled";
    await order.save();
  }

  return res.json({ received: true });
};

module.exports = { createCheckoutSession, handleStripeWebhook };
