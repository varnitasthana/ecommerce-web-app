const Product = require("../models/Product");
const mongoose = require("mongoose");

const validateProductInput = ({ name, description, price, category, stock }) => {
  if (!name || !description || !category) {
    return "Name, description, and category are required";
  }

  if (!Number.isFinite(Number(price)) || Number(price) < 0) {
    return "Price must be a non-negative number";
  }

  if (!Number.isInteger(Number(stock)) || Number(stock) < 0) {
    return "Stock must be a non-negative integer";
  }

  return null;
};

const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    const status = error instanceof mongoose.Error.CastError ? 400 : 500;
    res.status(status).json({ message: status === 400 ? "Invalid product id" : error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body;
    const validationError = validateProductInput(req.body);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const product = await Product.create({
      name,
      description,
      price: Number(price),
      category,
      image,
      stock: Number(stock)
    });

    res.status(201).json({
      message: "Product created successfully",
      product
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const validationError = validateProductInput(req.body);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, price: Number(req.body.price), stock: Number(req.body.stock) },
      { new: true }
    );

    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct
    });
  } catch (error) {
    const status = error instanceof mongoose.Error.CastError ? 400 : 500;
    res.status(status).json({ message: status === 400 ? "Invalid product id" : error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Product deleted successfully",
      productId: req.params.id
    });
  } catch (error) {
    const status = error instanceof mongoose.Error.CastError ? 400 : 500;
    res.status(status).json({ message: status === 400 ? "Invalid product id" : error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
