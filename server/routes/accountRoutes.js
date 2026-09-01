const express = require("express");
const {
  getProfile,
  updateProfile,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} = require("../controllers/accountController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/profile", getProfile);
router.patch("/profile", updateProfile);
router.post("/change-password", changePassword);

router.get("/addresses", getAddresses);
router.post("/addresses", addAddress);
router.patch("/addresses/:addressId", updateAddress);
router.delete("/addresses/:addressId", deleteAddress);
router.post("/addresses/:addressId/set-default", setDefaultAddress);

module.exports = router;
