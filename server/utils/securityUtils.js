const sanitizeEmail = (email) => {
  return String(email).toLowerCase().trim();
};

const sanitizeString = (str, maxLength = 500) => {
  if (typeof str !== "string") return "";
  return str.trim().slice(0, maxLength);
};

const sanitizeMongoId = (id) => {
  if (typeof id !== "string") return null;
  if (!/^[a-f\d]{24}$/i.test(id)) return null;
  return id;
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email).toLowerCase());
};

const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9\-\+\(\)\s]{10,}$/;
  return phoneRegex.test(String(phone));
};

const isValidPostalCode = (code) => {
  const codeRegex = /^[a-z0-9\-\s]{3,10}$/i;
  return codeRegex.test(String(code));
};

const sanitizeObject = (obj, allowedKeys) => {
  if (!obj || typeof obj !== "object") return {};
  
  const sanitized = {};
  for (const key of allowedKeys) {
    if (key in obj) {
      sanitized[key] = obj[key];
    }
  }
  return sanitized;
};

module.exports = {
  sanitizeEmail,
  sanitizeString,
  sanitizeMongoId,
  isValidEmail,
  isValidPhone,
  isValidPostalCode,
  sanitizeObject
};
