import express from "express";
import { protect } from "../middleware/auth.ts";
import {
  getAllPosts,
  getPostsByUser,
  getPostById,
  createPost,
  updatePost,
  deletePost,
} from "../controllers/postController.ts";

const router = express.Router();

// Public routes
router.get("/", getAllPosts);
router.get("/:id", getPostById);
router.get("/user/:userId", getPostsByUser);

// Protected routes - require authentication
router.post("/", protect, createPost);
router.put("/:id", protect, updatePost);
router.delete("/:id", protect, deletePost);
router.get("/my/posts", protect, getPostsByUser);

export default router;
