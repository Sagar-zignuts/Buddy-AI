import express from "express";
import {
  sendOTP,
  verifyOTP,
  login,
  googleAuth,
  googleCallback,
  getMe,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Email/Password authentication routes
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/login", login);

// Google OAuth routes
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);

// Protected routes
router.get("/me", protect, getMe);

export default router;

