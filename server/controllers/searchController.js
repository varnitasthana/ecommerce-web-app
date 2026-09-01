const Product = require("../models/Product");

const VALID_SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  "price-low": { price: 1 },
  "price-high": { price: -1 },
  "rating-high": { rating: -1, reviewCount: -1 },
  "rating-low": { rating: 1 },
  "popularity": { purchases: -1, rating: -1 }
};

const VALID_AVAILABILITIES = ["in-stock", "out-of-stock", "low-stock"];
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

const parseNumber = (value, defaultVal = null, min = null, max = null) => {
  if (value === undefined || value === null || value === "") return defaultVal;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (min !== null && parsed < min) return null;
  if (max !== null && parsed > max) return null;
  return parsed;
};

const parseArrayFilter = (value) => {
  if (!value) return [];
  if (typeof value !== "string") return [];
  return value.split(",").map((v) => v.trim()).filter(Boolean);
};

const buildSearchQuery = (queryParams) => {
  const filter = { active: true, deleted: false };
  const { search, category, subcategory, brand, minPrice, maxPrice, minRating, availability, inStock } = queryParams;

  if (search && typeof search === "string" && search.trim()) {
    const searchTerm = search.trim();
    if (searchTerm.length > 200) {
      throw Object.assign(new Error("Search term too long"), { statusCode: 400 });
    }
    filter.$text = { $search: searchTerm };
  }

  if (category && typeof category === "string") {
    const categoryList = parseArrayFilter(category);
    if (categoryList.length > 0) {
      filter.category = { $in: categoryList.map((c) => new RegExp(`^${c}$`, "i")) };
    }
  }

  if (subcategory && typeof subcategory === "string") {
    const subcategoryList = parseArrayFilter(subcategory);
    if (subcategoryList.length > 0) {
      filter.subcategory = { $in: subcategoryList.map((s) => new RegExp(`^${s}$`, "i")) };
    }
  }

  if (brand && typeof brand === "string") {
    const brandList = parseArrayFilter(brand);
    if (brandList.length > 0) {
      filter.brand = { $in: brandList.map((b) => new RegExp(`^${b}$`, "i")) };
    }
  }

  const minPriceNum = parseNumber(minPrice, undefined, 0, 999999999);
  const maxPriceNum = parseNumber(maxPrice, undefined, 0, 999999999);

  if (minPriceNum !== null || maxPriceNum !== null) {
    filter.price = {};
    if (minPriceNum !== null) filter.price.$gte = minPriceNum;
    if (maxPriceNum !== null) filter.price.$lte = maxPriceNum;
    if (minPriceNum !== null && maxPriceNum !== null && minPriceNum > maxPriceNum) {
      throw Object.assign(new Error("Min price cannot be greater than max price"), { statusCode: 400 });
    }
  }

  const minRatingNum = parseNumber(minRating, undefined, 0, 5);
  if (minRatingNum !== null) {
    filter.rating = { $gte: minRatingNum };
  }

  if (availability && VALID_AVAILABILITIES.includes(availability)) {
    if (availability === "in-stock") {
      filter.stock = { $gt: 0 };
    } else if (availability === "low-stock") {
      filter.stock = { $gt: 0, $lte: filter.lowStockThreshold || 10 };
    } else if (availability === "out-of-stock") {
      filter.stock = { $lte: 0 };
    }
  } else if (inStock === "true" || inStock === true) {
    filter.stock = { $gt: 0 };
  }

  return filter;
};

const searchProducts = async (req, res) => {
  try {
    const page = parseNumber(req.query.page, 1, 1);
    const limit = parseNumber(req.query.limit, DEFAULT_LIMIT, 1, MAX_LIMIT) || DEFAULT_LIMIT;
    const sort = VALID_SORTS[req.query.sort] || VALID_SORTS.newest;

    if (page === null || limit === null) {
      return res.status(400).json({
        message: "Invalid pagination parameters",
        details: {
          page: "Must be a positive integer",
          limit: `Must be between 1 and ${MAX_LIMIT}`
        }
      });
    }

    const filter = buildSearchQuery(req.query);
    const skip = (page - 1) * limit;

    const [products, total, facets] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select("_id name slug price compareAtPrice image category brand rating reviewCount stock deliveryDays")
        .lean(),
      Product.countDocuments(filter),
      Product.aggregate([
        { $match: filter },
        {
          $facet: {
            categories: [{ $group: { _id: "$category" } }, { $sort: { _id: 1 } }],
            brands: [{ $group: { _id: "$brand" } }, { $sort: { _id: 1 } }],
            priceRange: [
              { $group: { _id: null, minPrice: { $min: "$price" }, maxPrice: { $max: "$price" } } }
            ]
          }
        }
      ])
    ]);

    const totalPages = Math.ceil(total / limit);
    const priceFacet = facets[0]?.priceRange?.[0] || { minPrice: 0, maxPrice: 0 };

    res.status(200).json({
      status: "ok",
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        },
        facets: {
          categories: facets[0]?.categories
            ?.map((f) => f._id)
            .filter(Boolean)
            .sort(),
          brands: facets[0]?.brands
            ?.map((f) => f._id)
            .filter(Boolean)
            .sort(),
          priceRange: {
            min: priceFacet.minPrice || 0,
            max: priceFacet.maxPrice || 0
          }
        }
      }
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "error",
      message: error.statusCode ? error.message : "Unable to search products"
    });
  }
};

const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const page = parseNumber(req.query.page, 1, 1);
    const limit = parseNumber(req.query.limit, DEFAULT_LIMIT, 1, MAX_LIMIT) || DEFAULT_LIMIT;

    if (!category || typeof category !== "string" || category.length === 0) {
      return res.status(400).json({ message: "Category is required" });
    }

    if (page === null || limit === null) {
      return res.status(400).json({ message: "Invalid pagination parameters" });
    }

    const filter = {
      active: true,
      deleted: false,
      category: new RegExp(`^${category.trim()}$`, "i")
    };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ rating: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("_id name slug price compareAtPrice image rating reviewCount stock")
        .lean(),
      Product.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      category,
      products,
      pagination: { page, limit, total, totalPages }
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to load category products" });
  }
};

const getProductsByBrand = async (req, res) => {
  try {
    const { brand } = req.params;
    const page = parseNumber(req.query.page, 1, 1);
    const limit = parseNumber(req.query.limit, DEFAULT_LIMIT, 1, MAX_LIMIT) || DEFAULT_LIMIT;

    if (!brand || typeof brand !== "string" || brand.length === 0) {
      return res.status(400).json({ message: "Brand is required" });
    }

    if (page === null || limit === null) {
      return res.status(400).json({ message: "Invalid pagination parameters" });
    }

    const filter = {
      active: true,
      deleted: false,
      brand: new RegExp(`^${brand.trim()}$`, "i")
    };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ rating: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("_id name slug price compareAtPrice image rating reviewCount stock")
        .lean(),
      Product.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      brand,
      products,
      pagination: { page, limit, total, totalPages }
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to load brand products" });
  }
};

module.exports = {
  searchProducts,
  getProductsByCategory,
  getProductsByBrand
};
