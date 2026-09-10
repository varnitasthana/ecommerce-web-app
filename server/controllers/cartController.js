const Cart = require("../models/Cart");
const Product = require("../models/Product");

const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate("items.product", "name image price stock compareAtPrice brand category slug").populate("savedForLater.product", "name image price stock compareAtPrice brand category slug");
    if (!cart) return res.status(200).json({ cart: { items: [], savedForLater: [] } });
    res.status(200).json({ cart });
  } catch (error) {
    res.status(500).json({ message: "Unable to load cart" });
  }
};

const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const qty = Number(quantity);
    if (!productId || qty < 1) return res.status(400).json({ message: "Valid product and quantity are required" });

    const product = await Product.findOne({ _id: productId, active: true, deleted: false, stock: { $gte: qty } });
    if (!product) return res.status(400).json({ message: "Product is unavailable or out of stock" });

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) cart = await Cart.create({ user: req.user.id, items: [], savedForLater: [] });

    const existingIndex = cart.items.findIndex((item) => String(item.product) === String(productId));
    const currentQty = existingIndex >= 0 ? cart.items[existingIndex].quantity : 0;
    const newQty = currentQty + qty;
    if (newQty > product.stock) return res.status(400).json({ message: `Only ${product.stock} units available` });

    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity = newQty;
    } else {
      cart.items.push({ product: productId, quantity: qty, productPrice: product.price, productName: product.name, productImage: product.image });
    }

    await cart.save();
    res.status(200).json({ message: "Item added to cart", cart });
  } catch (error) {
    res.status(500).json({ message: "Unable to add item to cart" });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const qty = Number(quantity);
    if (!productId || qty < 1) return res.status(400).json({ message: "Valid product and quantity are required" });

    const product = await Product.findOne({ _id: productId, active: true, deleted: false });
    if (!product) return res.status(400).json({ message: "Product not found" });
    if (qty > product.stock) return res.status(400).json({ message: `Only ${product.stock} units available` });

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const itemIndex = cart.items.findIndex((item) => String(item.product) === String(productId));
    if (itemIndex < 0) return res.status(404).json({ message: "Item not in cart" });

    cart.items[itemIndex].quantity = qty;
    await cart.save();
    res.status(200).json({ message: "Cart updated", cart });
  } catch (error) {
    res.status(500).json({ message: "Unable to update cart" });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: "Product ID is required" });

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter((item) => String(item.product) !== String(productId));
    await cart.save();
    res.status(200).json({ message: "Item removed from cart", cart });
  } catch (error) {
    res.status(500).json({ message: "Unable to remove item from cart" });
  }
};

const saveForLater = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: "Product ID is required" });

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const itemIndex = cart.items.findIndex((item) => String(item.product) === String(productId));
    if (itemIndex < 0) return res.status(404).json({ message: "Item not in cart" });

    const [item] = cart.items.splice(itemIndex, 1);
    cart.savedForLater.push(item);
    await cart.save();
    res.status(200).json({ message: "Item saved for later", cart });
  } catch (error) {
    res.status(500).json({ message: "Unable to save item for later" });
  }
};

const moveToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: "Product ID is required" });

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const savedIndex = cart.savedForLater.findIndex((item) => String(item.product) === String(productId));
    if (savedIndex < 0) return res.status(404).json({ message: "Item not saved for later" });

    const [item] = cart.savedForLater.splice(savedIndex, 1);
    const existingIndex = cart.items.findIndex((i) => String(i.product) === String(productId));
    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += item.quantity;
    } else {
      cart.items.push(item);
    }

    await cart.save();
    res.status(200).json({ message: "Item moved to cart", cart });
  } catch (error) {
    res.status(500).json({ message: "Unable to move item to cart" });
  }
};

const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(200).json({ message: "Cart cleared", cart: { items: [], savedForLater: [] } });
    cart.items = [];
    await cart.save();
    res.status(200).json({ message: "Cart cleared", cart });
  } catch (error) {
    res.status(500).json({ message: "Unable to clear cart" });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, saveForLater, moveToCart, clearCart };
