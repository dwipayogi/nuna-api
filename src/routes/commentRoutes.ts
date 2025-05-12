import express from "express";
import { protect } from "../middleware/auth.ts";
import {
  getCommentsByPost,
  createComment,
  updateComment,
  deleteComment,
} from "../controllers/commentController.ts";

const router = express.Router();

// Get comments for a specific post - public
router.get("/post/:postId", getCommentsByPost);

// Protected routes - require authentication
router.post("/", protect, createComment);
router.put("/:id", protect, updateComment);
router.delete("/:id", protect, deleteComment);

export default router;
