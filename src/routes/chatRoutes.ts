import express from "express";
import {
  chatWithAI,
  getAIRecommendations,
} from "../controllers/chatController.ts";
import { protect } from "../middleware/auth.ts";

const router = express.Router();

// Protected route for chat with AI
router.post("/", protect, chatWithAI);

// Protected route for getting AI recommendations based on authenticated user
router.get("/recommendations", protect, getAIRecommendations);

export default router;
