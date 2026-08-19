const allowedRoles = ["customer", "seller", "admin"];

const validateRole = (role) => {
  if (!allowedRoles.includes(role)) return "Role must be customer, seller, or admin";
  return null;
};

module.exports = { allowedRoles, validateRole };
