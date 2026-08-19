const SellerApplication = require("../models/SellerApplication");

const getMyApplications = async (req, res) => {
  const applications = await SellerApplication.find({ applicant: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json(applications);
};

const createApplication = async (req, res) => {
  try {
    const { brandName, contactEmail, category, website, message } = req.body;
    if (!brandName || !contactEmail || !category || !message) {
      return res.status(400).json({ message: "Brand, email, category, and message are required" });
    }

    const application = await SellerApplication.create({
      applicant: req.user?.id,
      brandName,
      contactEmail,
      category,
      website,
      message
    });
    res.status(201).json({ message: "Partnership application submitted", application });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getApplications = async (req, res) => {
  const applications = await SellerApplication.find().populate("applicant", "name email").sort({ createdAt: -1 });
  res.status(200).json(applications);
};

const updateApplicationStatus = async (req, res) => {
  const application = await SellerApplication.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  );
  if (!application) return res.status(404).json({ message: "Application not found" });
  res.status(200).json({ message: "Application updated", application });
};

module.exports = { createApplication, getApplications, updateApplicationStatus, getMyApplications };