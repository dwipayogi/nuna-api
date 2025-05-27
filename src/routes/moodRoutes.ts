import express from "express";
import { protect } from "../middleware/auth.ts";
import {
  createMoodEntry,
  getActiveMood,
  updateMoodEntry,
  getMoodHistory,
  getMoodStats,
  getMoodDistribution,
} from "../controllers/moodController.ts";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Routes
router.post("/", createMoodEntry);
router.get("/active", getActiveMood);
router.put("/:id", updateMoodEntry);
router.get("/", getMoodHistory);
router.get("/stats", getMoodStats);
router.get("/distribution", getMoodDistribution);

export default router;
