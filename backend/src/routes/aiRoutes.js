import express from "express";
import { getHint, generateQuiz, aiChat, getChatHistory, clearChat } from "../controllers/aiController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/hints", getHint);
router.post("/quiz", generateQuiz);
router.post("/chat", protect, aiChat);
router.get("/chat/history", protect, getChatHistory);
router.delete("/chat/clear", protect, clearChat);

export default router;
