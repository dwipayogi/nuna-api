import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.ts";
import journalRoutes from "./routes/journalRoutes.ts";
import postRoutes from "./routes/postRoutes.ts";
import commentRoutes from "./routes/commentRoutes.ts";
import meditateRoutes from "./routes/meditateRoutes.ts";
import chatRoutes from "./routes/chatRoutes.ts";
import { ErrorRequestHandler } from "express";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/journals", journalRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/meditate", meditateRoutes);
app.use("/api/chat", chatRoutes);

// Error handler
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong" });
};

app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
