const Category = require("../models/Category");

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
    res.status(200).json({ categories });
  } catch (error) {
    res.status(500).json({ message: "Unable to load categories" });
  }
};

const getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true });
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.status(200).json({ category });
  } catch (error) {
    res.status(500).json({ message: "Unable to load category" });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description, image, parentCategory, sortOrder } = req.body;
    const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    const category = await Category.create({ name, description, image, parentCategory, sortOrder: sortOrder || 0, slug });
    res.status(201).json({ message: "Category created", category });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Category already exists" });
    res.status(500).json({ message: "Unable to create category" });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { name, description, image, parentCategory, isActive, sortOrder } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    if (name !== undefined) {
      category.name = name;
      category.slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (parentCategory !== undefined) category.parentCategory = parentCategory || null;
    if (isActive !== undefined) category.isActive = isActive;
    if (sortOrder !== undefined) category.sortOrder = sortOrder;

    await category.save();
    res.status(200).json({ message: "Category updated", category });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Category already exists" });
    res.status(500).json({ message: "Unable to update category" });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, { isActive: false });
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.status(200).json({ message: "Category deactivated" });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete category" });
  }
};

module.exports = { getCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory };
