import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!process.env.JWT_SECRET) {
  console.warn("⚠️  JWT_SECRET not set in environment. Using default secret (not secure for production!)");
}

export const generateToken = (userId, tokenVersion = 0) => {
  return jwt.sign({ userId, tokenVersion }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

