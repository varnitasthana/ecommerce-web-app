const cloudinary = require("cloudinary").v2;
const { requireIntegration } = require("../config/integrations");

const createUploadSignature = (req, res) => {
  try {
    requireIntegration("media");
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "shopease/products";
    const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, process.env.CLOUDINARY_API_SECRET);
    res.status(200).json({ timestamp, folder, signature, apiKey: process.env.CLOUDINARY_API_KEY, cloudName: process.env.CLOUDINARY_CLOUD_NAME });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

module.exports = { createUploadSignature };
