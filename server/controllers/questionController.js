const Question = require("../models/Question");
const Product = require("../models/Product");

const getQuestions = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const product = await Product.findById(productId).select("_id").lean();
    if (!product) return res.status(404).json({ message: "Product not found" });
    const [questions, total] = await Promise.all([
      Question.find({ product: productId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("user", "name")
        .populate("answeredBy", "name")
        .lean(),
      Question.countDocuments({ product: productId })
    ]);
    res.status(200).json({ questions, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
  } catch (error) {
    res.status(500).json({ message: "Unable to load questions" });
  }
};

const createQuestion = async (req, res) => {
  try {
    const { productId } = req.params;
    const { question } = req.body;
    const product = await Product.findById(productId).select("_id").lean();
    if (!product) return res.status(404).json({ message: "Product not found" });
    const q = await Question.create({ product: productId, user: req.user.id, question });
    res.status(201).json(q);
  } catch (error) {
    res.status(400).json({ message: error.message || "Unable to post question" });
  }
};

const answerQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;
    const q = await Question.findById(id);
    if (!q) return res.status(404).json({ message: "Question not found" });
    if (!q.answer) q.helpful = 0;
    q.answer = answer;
    q.answeredBy = req.user.id;
    q.answeredAt = new Date();
    await q.save();
    res.status(200).json(q);
  } catch (error) {
    res.status(400).json({ message: error.message || "Unable to answer question" });
  }
};

const markHelpful = async (req, res) => {
  try {
    const { id } = req.params;
    const q = await Question.findById(id);
    if (!q) return res.status(404).json({ message: "Question not found" });
    q.helpful = (q.helpful || 0) + 1;
    await q.save();
    res.status(200).json({ helpful: q.helpful });
  } catch (error) {
    res.status(500).json({ message: "Unable to mark as helpful" });
  }
};

module.exports = { getQuestions, createQuestion, answerQuestion, markHelpful };
