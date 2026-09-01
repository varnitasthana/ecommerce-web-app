const slugify = (value) => String(value || "")
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const discountPercent = (price, compareAtPrice) => {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
};

const publicProduct = (product) => {
  const data = product.toObject ? product.toObject() : product;
  return {
    ...data,
    image: data.image || data.images?.[0] || "",
    discountPercent: discountPercent(data.price, data.compareAtPrice),
    stockStatus: data.stock > 0 ? "in_stock" : "out_of_stock"
  };
};

module.exports = { slugify, discountPercent, publicProduct };
