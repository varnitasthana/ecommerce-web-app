const isRealValue = (value) => Boolean(value && !/(your_|replace_|_here|example\.com)/i.test(value));

const integrationStatus = () => ({
  payments: isRealValue(process.env.STRIPE_SECRET_KEY) && isRealValue(process.env.STRIPE_WEBHOOK_SECRET),
  media: isRealValue(process.env.CLOUDINARY_CLOUD_NAME) && isRealValue(process.env.CLOUDINARY_API_KEY) && isRealValue(process.env.CLOUDINARY_API_SECRET),
  notifications: isRealValue(process.env.EMAIL_FROM) && isRealValue(process.env.EMAIL_API_KEY),
  shipping: isRealValue(process.env.SHIPPING_API_KEY) && isRealValue(process.env.SHIPPING_API_URL)
});

const requireIntegration = (name) => {
  if (!integrationStatus()[name]) {
    const error = new Error(`${name} integration is not configured`);
    error.statusCode = 503;
    throw error;
  }
};

module.exports = { integrationStatus, isRealValue, requireIntegration };
