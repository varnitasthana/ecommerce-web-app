const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normaliseEmail = (email) => String(email || "").trim().toLowerCase();

const validateRegistration = ({ name, email, password }) => {
  const normalizedEmail = normaliseEmail(email);

  if (!String(name || "").trim() || !normalizedEmail || !password) {
    return "Name, email, and password are required";
  }

  if (!emailPattern.test(normalizedEmail)) {
    return "Enter a valid email address";
  }

  if (String(password).length < 8) {
    return "Password must be at least 8 characters";
  }

  return null;
};

const validateLogin = ({ email, password }) => {
  const normalizedEmail = normaliseEmail(email);

  if (!normalizedEmail || !password) return "Email and password are required";
  if (!emailPattern.test(normalizedEmail)) return "Enter a valid email address";

  return null;
};

module.exports = { normaliseEmail, validateRegistration, validateLogin };
