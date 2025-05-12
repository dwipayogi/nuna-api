import express from "express";
import {
  getAllMeditations,
  getMeditationById,
  createMeditation,
  updateMeditation,
  deleteMeditation,
} from "../controllers/meditateController.ts";

const router = express.Router();

// All routes are public (no middleware)

// Get all meditations
router.get("/", getAllMeditations);

// Get a single meditation by ID
router.get("/:id", getMeditationById);

// Create a new meditation
router.post("/", createMeditation);

// Update a meditation
router.put("/:id", updateMeditation);

// Delete a meditation
router.delete("/:id", deleteMeditation);

export default router;
