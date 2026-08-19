const { isRealValue } = require("./integrations");

const validateEnvironment = () => {
  const required = ["MONGO_URI", "JWT_SECRET"];
  const missing = required.filter((key) => !isRealValue(process.env[key]));

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (process.env.JWT_SECRET.length < 24) {
    throw new Error("JWT_SECRET must be at least 24 characters");
  }
};

module.exports = { validateEnvironment };
