import express from "express";
import {
  getAllPosts,
  getPostById,
  getPostsByUser,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
} from "../controllers/postController.ts";
import { protect } from "../middleware/auth.ts";

const router = express.Router();

// Public routes
router.get("/", getAllPosts);
router.get("/:id", getPostById);
router.get("/user/:userId", getPostsByUser);

// Protected routes
router.get("/my/posts", protect, getPostsByUser);
router.post("/", protect, createPost);
router.put("/:id", protect, updatePost);
router.delete("/:id", protect, deletePost);

// Like/unlike routes
router.post("/:id/like", protect, likePost);
router.post("/:id/unlike", protect, unlikePost);

export default router;
