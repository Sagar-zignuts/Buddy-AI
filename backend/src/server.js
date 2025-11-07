import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import passport from "passport";
import { connectDB } from "./config/database.js";
import aiRoutes from "./routes/aiRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cron from "node-cron";
import User from "./models/User.js";

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());

// Routes
app.use("/api/ai", aiRoutes);
app.use("/api/auth", authRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server is running" });
});

const port = process.env.PORT || 3175;

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});

// Nightly logout: increment tokenVersion for all users at midnight server time
try {
  cron.schedule("0 0 * * *", async () => {
    try {
      await User.updateMany({}, { $inc: { tokenVersion: 1 } });
      console.log("🔒 Nightly logout: tokenVersion incremented for all users");
    } catch (e) {
      console.error("Nightly logout failed:", e);
    }
  });
} catch (e) {
  console.error("Cron scheduling failed (install node-cron):", e.message);
}
