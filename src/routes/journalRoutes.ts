import express from "express";
import { protect } from "../middleware/auth.ts";
import {
  getJournals,
  getJournalById,
  createJournal,
  updateJournal,
  deleteJournal,
} from "../controllers/journalController.ts";

const router = express.Router();

// All journal routes are protected
router.use(protect);

// Get all journals for the authenticated user
router.get("/", getJournals);

// Get a single journal by ID
router.get("/:id", getJournalById);

// Create a new journal
router.post("/", createJournal);

// Update a journal
router.put("/:id", updateJournal);

// Delete a journal
router.delete("/:id", deleteJournal);

export default router;
