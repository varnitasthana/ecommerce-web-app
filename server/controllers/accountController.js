const User = require("../models/User");
const Address = require("../models/Address");
const Token = require("../models/Token");
const bcrypt = require("bcryptjs");
const { validateAddress, validateProfileUpdate, validatePasswordReset } = require("../validators/accountValidator");

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password -__v")
      .populate("defaultAddressId");

    if (!user || user.isDeleted) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.getPublicProfile());
  } catch (error) {
    res.status(500).json({ message: "Unable to load profile" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const validationError = validateProfileUpdate(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name.trim();
    if (req.body.phone !== undefined) updates.phone = req.body.phone || null;
    if (req.body.gender !== undefined) updates.gender = req.body.gender || null;
    if (req.body.dateOfBirth !== undefined) updates.dateOfBirth = req.body.dateOfBirth || null;

    const user = await User.findByIdAndUpdate(req.user.id, updates, { returnDocument: "after" });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: user.getPublicProfile()
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to update profile" });
  }
};

const changePassword = async (req, res) => {
  try {
    const validationError = validatePasswordReset(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(req.body.currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Unable to change password" });
  }
};

const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user.id }).sort({ isDefault: -1, createdAt: -1 });

    res.status(200).json(addresses);
  } catch (error) {
    res.status(500).json({ message: "Unable to load addresses" });
  }
};

const addAddress = async (req, res) => {
  try {
    const validationError = validateAddress(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { isDefault } = req.body;

    if (isDefault) {
      await Address.updateMany({ user: req.user.id }, { isDefault: false });
    }

    const address = await Address.create({
      user: req.user.id,
      ...req.body
    });

    if (isDefault) {
      await User.findByIdAndUpdate(req.user.id, { defaultAddressId: address._id });
    }

    res.status(201).json({
      message: "Address added successfully",
      address
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to add address" });
  }
};

const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const address = await Address.findOne({ _id: addressId, user: req.user.id });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    const validationError = validateAddress(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { isDefault } = req.body;

    if (isDefault && !address.isDefault) {
      await Address.updateMany({ user: req.user.id }, { isDefault: false });
      await User.findByIdAndUpdate(req.user.id, { defaultAddressId: addressId });
    }

    Object.assign(address, req.body);
    await address.save();

    res.status(200).json({
      message: "Address updated successfully",
      address
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to update address" });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const address = await Address.findOne({ _id: addressId, user: req.user.id });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    await Address.findByIdAndDelete(addressId);

    const wasDefault = address.isDefault;

    if (wasDefault) {
      const defaultAddress = await Address.findOne({ user: req.user.id }).sort({ createdAt: -1 });

      if (defaultAddress) {
        defaultAddress.isDefault = true;
        await defaultAddress.save();
        await User.findByIdAndUpdate(req.user.id, { defaultAddressId: defaultAddress._id });
      } else {
        await User.findByIdAndUpdate(req.user.id, { defaultAddressId: null });
      }
    }

    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete address" });
  }
};

const setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const address = await Address.findOne({ _id: addressId, user: req.user.id });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    await Address.updateMany({ user: req.user.id }, { isDefault: false });

    address.isDefault = true;
    await address.save();

    await User.findByIdAndUpdate(req.user.id, { defaultAddressId: addressId });

    res.status(200).json({
      message: "Default address updated successfully",
      address
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to set default address" });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
};
