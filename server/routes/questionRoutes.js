const express = require("express");
const { getQuestions, createQuestion, answerQuestion, markHelpful } = require("../controllers/questionController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/products/:productId/questions", getQuestions);
router.post("/products/:productId/questions", protect, createQuestion);
router.post("/questions/:id/answer", protect, answerQuestion);
router.post("/questions/:id/helpful", markHelpful);

module.exports = router;
