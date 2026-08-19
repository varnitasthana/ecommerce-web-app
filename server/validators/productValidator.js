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

module.exports = { validateProductInput };
