import express from "express";
import { login, register } from "../controllers/authController.ts";
import { protect } from "../middleware/auth.ts";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected route example
router.get("/profile", protect, (req, res) => {
  res.status(200).json({
    message: "Profile accessed successfully",
    user: req.user,
  });
});

export default router;
