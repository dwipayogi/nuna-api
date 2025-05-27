import express from "express";
import { protect } from "../middleware/auth.ts";
import { createToken } from "../controllers/livekitController.ts";

const router = express.Router();

// Protected route to create a LiveKit token
router.post("/token", protect, createToken);

export default router;