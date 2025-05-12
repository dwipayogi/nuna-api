import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./src/routes/authRoutes.ts";
import journalRoutes from "./src/routes/journalRoutes.ts";
import postRoutes from "./src/routes/postRoutes.ts";
import commentRoutes from "./src/routes/commentRoutes.ts";
import meditateRoutes from "./src/routes/meditateRoutes.ts";

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/journals", journalRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/meditate", meditateRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Nuna API" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
