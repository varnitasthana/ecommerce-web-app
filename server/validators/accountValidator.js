const validateAddress = ({ name, email, phone, street, city, postalCode, country, state, type }) => {
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return "Address name is required";
  }

  if (!email || typeof email !== "string" || !/@/.test(email)) {
    return "Valid email is required";
  }

  if (!phone || typeof phone !== "string" || phone.trim().length < 10) {
    return "Valid phone number is required";
  }

  if (!street || typeof street !== "string" || street.trim().length === 0) {
    return "Street address is required";
  }

  if (!city || typeof city !== "string" || city.trim().length === 0) {
    return "City is required";
  }

  if (!postalCode || typeof postalCode !== "string" || postalCode.trim().length === 0) {
    return "Postal code is required";
  }

  if (country && typeof country !== "string") {
    return "Country must be a string";
  }

  if (state && typeof state !== "string") {
    return "State must be a string";
  }

  if (type && !["home", "work", "other"].includes(type)) {
    return "Address type must be home, work, or other";
  }

  return null;
};

const validateProfileUpdate = ({ name, phone, dateOfBirth, gender }) => {
  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length === 0) {
      return "Name must be a non-empty string";
    }
    if (name.length > 100) {
      return "Name must be 100 characters or less";
    }
  }

  if (phone !== undefined) {
    if (phone && (typeof phone !== "string" || phone.trim().length < 10)) {
      return "Phone must be at least 10 characters";
    }
  }

  if (gender !== undefined) {
    if (gender && !["male", "female", "other", "prefer_not_to_say"].includes(gender)) {
      return "Invalid gender";
    }
  }

  if (dateOfBirth !== undefined) {
    if (dateOfBirth) {
      const date = new Date(dateOfBirth);
      if (isNaN(date.getTime())) {
        return "Invalid date format";
      }
      const age = new Date().getFullYear() - date.getFullYear();
      if (age < 13) {
        return "User must be at least 13 years old";
      }
    }
  }

  return null;
};

const validatePasswordReset = ({ currentPassword, newPassword, confirmPassword }) => {
  if (!currentPassword || typeof currentPassword !== "string") {
    return "Current password is required";
  }

  if (!newPassword || typeof newPassword !== "string") {
    return "New password is required";
  }

  if (!confirmPassword || typeof confirmPassword !== "string") {
    return "Password confirmation is required";
  }

  if (newPassword.length < 8) {
    return "New password must be at least 8 characters";
  }

  if (newPassword !== confirmPassword) {
    return "Passwords do not match";
  }

  if (currentPassword === newPassword) {
    return "New password must be different from current password";
  }

  return null;
};

module.exports = {
  validateAddress,
  validateProfileUpdate,
  validatePasswordReset
};
