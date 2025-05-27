import express from "express";
import {
  chatWithAI,
  getAIRecommendations,
  getPatternAnalysis,
  getProgressAnalysis,
} from "../controllers/chatController.ts";
import { protect } from "../middleware/auth.ts";

const router = express.Router();

// Protected route for chat with AI
router.post("/", protect, chatWithAI);

// Protected route for getting AI recommendations based on authenticated user
router.get("/recommendations", protect, getAIRecommendations);

// Protected route for getting AI pattern analysis based on user journals and mood
router.get("/patterns", protect, getPatternAnalysis);

// Protected route for getting user's progress analysis
router.get("/progress", protect, getProgressAnalysis);

export default router;
