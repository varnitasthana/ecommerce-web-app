const validateProductInput = ({ 
  name, description, longDescription, price, compareAtPrice, category, brand, sku, stock, 
  images, active, lowStockThreshold, weight, warranty, returnPolicy, deliveryDays, attributes 
}) => {
  if (!name || !description || !category) {
    return "Name, description, and category are required";
  }

  if (typeof name !== "string" || name.trim().length === 0 || name.length > 200) {
    return "Name must be a non-empty string up to 200 characters";
  }

  if (typeof description !== "string" || description.trim().length === 0) {
    return "Description is required and must be non-empty";
  }

  if (!Number.isFinite(Number(price)) || Number(price) < 0) {
    return "Price must be a non-negative number";
  }

  if (!Number.isInteger(Number(stock)) || Number(stock) < 0) {
    return "Stock must be a non-negative integer";
  }

  if (compareAtPrice !== undefined && compareAtPrice !== "" && (!Number.isFinite(Number(compareAtPrice)) || Number(compareAtPrice) < Number(price))) {
    return "MRP/Compare price must be greater than or equal to selling price";
  }

  if (brand !== undefined && !String(brand).trim()) return "Brand cannot be empty";
  
  if (sku !== undefined && sku !== "" && !/^[A-Z0-9][A-Z0-9_-]{2,40}$/i.test(String(sku).trim())) {
    return "SKU must start with alphanumeric and contain 3-41 characters (alphanumeric, dash, underscore)";
  }

  if (images !== undefined && (!Array.isArray(images) || images.some((image) => typeof image !== "string" || !/^https?:\/\//i.test(image)))) {
    return "Images must be an array of valid HTTPS URLs";
  }

  if (active !== undefined && typeof active !== "boolean") return "Active must be boolean";

  if (lowStockThreshold !== undefined && (!Number.isInteger(Number(lowStockThreshold)) || Number(lowStockThreshold) < 0)) {
    return "Low stock threshold must be a non-negative integer";
  }

  if (weight !== undefined && weight !== null && (!Number.isFinite(Number(weight)) || Number(weight) <= 0)) {
    return "Weight must be a positive number or null";
  }

  if (deliveryDays !== undefined && (!Number.isInteger(Number(deliveryDays)) || Number(deliveryDays) < 1 || Number(deliveryDays) > 30)) {
    return "Delivery days must be between 1 and 30";
  }

  if (warranty !== undefined && warranty !== null && typeof warranty !== "string") {
    return "Warranty must be a string or null";
  }

  if (returnPolicy !== undefined && returnPolicy !== null && typeof returnPolicy !== "string") {
    return "Return policy must be a string or null";
  }

  if (longDescription !== undefined && typeof longDescription !== "string") {
    return "Long description must be a string";
  }

  if (attributes !== undefined && (typeof attributes !== "object" || Array.isArray(attributes))) {
    return "Attributes must be an object";
  }

  return null;
};

module.exports = { validateProductInput };
