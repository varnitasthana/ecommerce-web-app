const Product = require("../models/Product");
const mongoose = require("mongoose");
const { validateProductInput } = require("../validators/productValidator");
const { slugify, publicProduct } = require("../utils/productUtils");

const allowedSorts = {
  newest: { createdAt: -1 },
  "price-low": { price: 1 },
  "price-high": { price: -1 },
  rating: { rating: -1, reviewCount: -1 },
  featured: { rating: -1, createdAt: -1 }
};

const parseBoundedNumber = (value, fallback) => {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildProductQuery = (query) => {
  const filter = { active: true, deleted: false };
  const { search, category, brand, minPrice, maxPrice, minRating, availability } = query;
  if (search?.trim()) filter.$text = { $search: search.trim() };
  if (category && category !== "all") filter.category = new RegExp(`^${category}$`, "i");
  if (brand && brand !== "all") filter.brand = new RegExp(`^${brand}$`, "i");
  const min = parseBoundedNumber(minPrice, undefined);
  const max = parseBoundedNumber(maxPrice, undefined);
  const rating = parseBoundedNumber(minRating, undefined);
  if (min === null || max === null || rating === null) throw Object.assign(new Error("Invalid numeric product filter"), { statusCode: 400 });
  if (min !== undefined || max !== undefined) filter.price = { ...(min !== undefined ? { $gte: min } : {}), ...(max !== undefined ? { $lte: max } : {}) };
  if (rating !== undefined) {
    if (rating < 0 || rating > 5) throw Object.assign(new Error("Rating filter must be between 0 and 5"), { statusCode: 400 });
    filter.rating = { $gte: rating };
  }
  if (availability === "in-stock") filter.stock = { $gt: 0 };
  if (availability === "out-of-stock") filter.stock = { $lte: 0 };
  if (availability && !["in-stock", "out-of-stock"].includes(availability)) throw Object.assign(new Error("Invalid availability filter"), { statusCode: 400 });
  return filter;
};

const getProducts = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 12);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 48) return res.status(400).json({ message: "Page must be at least 1 and limit must be between 1 and 48" });
    const filter = buildProductQuery(req.query);
    const sort = allowedSorts[req.query.sort || "featured"];
    if (!sort) return res.status(400).json({ message: "Invalid sort option" });
    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(filter)
    ]);
    const totalPages = Math.ceil(total / limit);
    res.status(200).json({ products: products.map(publicProduct), pagination: { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 } });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : "Unable to load products" });
  }
};

const getProductById = async (req, res) => {
  try {
    const identifier = req.params.id;
    const query = mongoose.Types.ObjectId.isValid(identifier) ? { _id: identifier } : { slug: identifier.toLowerCase() };
    const product = await Product.findOne({ ...query, active: true, deleted: false }).lean();
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(publicProduct(product));
  } catch (error) {
    res.status(500).json({ message: "Unable to load product" });
  }
};

const getCatalogFacets = async (req, res) => {
  const [categories, brands] = await Promise.all([
    Product.distinct("category", { active: true, deleted: false }),
    Product.distinct("brand", { active: true, deleted: false })
  ]);
  res.status(200).json({ categories: categories.filter(Boolean).sort(), brands: brands.filter(Boolean).sort() });
};

const createProduct = async (req, res) => {
  try {
    const validationError = validateProductInput(req.body);
    if (validationError) return res.status(400).json({ message: validationError });
    const payload = { ...req.body, price: Number(req.body.price), stock: Number(req.body.stock), compareAtPrice: Number(req.body.compareAtPrice || 0), slug: slugify(req.body.slug || req.body.name), images: req.body.images || (req.body.image ? [req.body.image] : []) };
    const product = await Product.create(payload);
    res.status(201).json({ message: "Product created successfully", product: publicProduct(product) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Product slug or SKU already exists" });
    res.status(500).json({ message: "Unable to create product" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const validationError = validateProductInput(req.body);
    if (validationError) return res.status(400).json({ message: validationError });
    const updates = { ...req.body, price: Number(req.body.price), stock: Number(req.body.stock), compareAtPrice: Number(req.body.compareAtPrice || 0) };
    if (req.body.slug || req.body.name) updates.slug = slugify(req.body.slug || req.body.name);
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { returnDocument: "after", runValidators: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ message: "Product updated successfully", product: publicProduct(product) });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) return res.status(400).json({ message: "Invalid product id" });
    if (error.code === 11000) return res.status(409).json({ message: "Product slug or SKU already exists" });
    res.status(500).json({ message: "Unable to update product" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id, 
      { deleted: true, deletedAt: new Date(), active: false }, 
      { returnDocument: "after" }
    );
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ message: "Product deleted successfully", productId: req.params.id });
  } catch (error) {
    res.status(error instanceof mongoose.Error.CastError ? 400 : 500).json({ message: error instanceof mongoose.Error.CastError ? "Invalid product id" : "Unable to delete product" });
  }
};

module.exports = { getProducts, getProductById, getCatalogFacets, createProduct, updateProduct, deleteProduct };
