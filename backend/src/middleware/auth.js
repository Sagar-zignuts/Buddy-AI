import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login.",
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Get user from token (using UUID string instead of ObjectId)
    const user = await User.findById(decoded.userId).select("-password -otp");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Token is invalid.",
      });
    }
    if (user.tokenVersion !== (decoded.tokenVersion ?? 0)) {
      return res.status(401).json({ success: false, message: "Session expired. Please login again." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || "Not authorized. Token is invalid.",
    });
  }
};

