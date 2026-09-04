const SellerApplication = require("../models/SellerApplication");
const Product = require("../models/Product");
const { validateProductInput } = require("../validators/productValidator");
const { slugify, publicProduct } = require("../utils/productUtils");

const getSellerProducts = async (req, res) => {
  const products = await Product.find({ seller: req.user.id, deleted: false }).sort({ createdAt: -1 }).lean();
  res.status(200).json({ products: products.map(publicProduct) });
};

const createSellerProduct = async (req, res) => {
  try {
    const validationError = validateProductInput(req.body);
    if (validationError) return res.status(400).json({ message: validationError });

    const payload = {
      ...req.body,
      seller: req.user.id,
      price: Number(req.body.price),
      stock: Number(req.body.stock),
      compareAtPrice: Number(req.body.compareAtPrice || 0),
      slug: slugify(req.body.slug || req.body.name),
      images: req.body.images || (req.body.image ? [req.body.image] : [])
    };
    const product = await Product.create(payload);
    res.status(201).json({ message: "Seller product created successfully", product: publicProduct(product) });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({ message: error.code === 11000 ? "Product slug or SKU already exists" : "Unable to create seller product" });
  }
};

const updateSellerProduct = async (req, res) => {
  try {
    const validationError = validateProductInput(req.body);
    if (validationError) return res.status(400).json({ message: validationError });

    const updates = {
      ...req.body,
      price: Number(req.body.price),
      stock: Number(req.body.stock),
      compareAtPrice: Number(req.body.compareAtPrice || 0)
    };
    if (req.body.slug || req.body.name) updates.slug = slugify(req.body.slug || req.body.name);
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, seller: req.user.id, deleted: false },
      updates,
      { returnDocument: "after", runValidators: true }
    );
    if (!product) return res.status(404).json({ message: "Seller product not found" });
    res.status(200).json({ message: "Seller product updated successfully", product: publicProduct(product) });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({ message: error.code === 11000 ? "Product slug or SKU already exists" : "Unable to update seller product" });
  }
};

const deleteSellerProduct = async (req, res) => {
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, seller: req.user.id, deleted: false },
    { deleted: true, deletedAt: new Date(), active: false },
    { returnDocument: "after" }
  );
  if (!product) return res.status(404).json({ message: "Seller product not found" });
  res.status(200).json({ message: "Seller product deleted successfully", productId: product._id });
};

const getMyApplications = async (req, res) => {
  const applications = await SellerApplication.find({ applicant: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json(applications);
};

const createApplication = async (req, res) => {
  try {
    const { brandName, contactEmail, category, website, message } = req.body;
    if (!brandName || !contactEmail || !category || !message) {
      return res.status(400).json({ message: "Brand, email, category, and message are required" });
    }

    const application = await SellerApplication.create({
      applicant: req.user?.id,
      brandName,
      contactEmail,
      category,
      website,
      message
    });
    res.status(201).json({ message: "Partnership application submitted", application });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getApplications = async (req, res) => {
  const applications = await SellerApplication.find().populate("applicant", "name email").sort({ createdAt: -1 });
  res.status(200).json(applications);
};

const updateApplicationStatus = async (req, res) => {
  const application = await SellerApplication.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { returnDocument: "after", runValidators: true }
  );
  if (!application) return res.status(404).json({ message: "Application not found" });
  res.status(200).json({ message: "Application updated", application });
};

module.exports = {
  createApplication,
  getApplications,
  updateApplicationStatus,
  getMyApplications,
  getSellerProducts,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct
};