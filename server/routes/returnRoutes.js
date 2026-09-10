const express = require("express");
const { createReturn, getMyReturns, getAllReturns, updateReturnStatus } = require("../controllers/returnController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", createReturn);
router.get("/my", getMyReturns);

const adminRouter = express.Router();
adminRouter.use(protect, adminOnly);
adminRouter.get("/", getAllReturns);
adminRouter.put("/:id", updateReturnStatus);

module.exports = { default: router, admin: adminRouter };
