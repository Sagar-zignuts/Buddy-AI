import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";
import { sendOTPEmail, sendWelcomeEmail } from "../utils/emailService.js";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";

dotenv.config();

// Configure Google OAuth Strategy (only if credentials are provided)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            return done(null, user);
          }

          // Check if user exists with this email
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            user.name = user.name || profile.displayName;
            user.isEmailVerified = true;
            await user.save();
            return done(null, user);
          }

          // Create new user
          user = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            isEmailVerified: true,
          });

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
} else {
  console.log("⚠️  Google OAuth credentials not configured. Google login will be disabled.");
}

// Send OTP for registration/login (accepts email and password)
export const sendOTP = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // For new registration, password is required
      if (!password) {
        return res.status(400).json({
          success: false,
          message: "Password is required for new registration",
        });
      }
      // Create new user but don't save password yet (will be saved after OTP verification)
      user = await User.create({
        email: email.toLowerCase(),
        password: password, // Will be hashed by pre-save hook
        name: name || "",
        isEmailVerified: false,
      });
    } else {
      // For existing user, if password is provided, verify it
      if (password) {
        const userWithPassword = await User.findOne({ email: email.toLowerCase() }).select("+password");
        if (userWithPassword && userWithPassword.password) {
          const isPasswordValid = await userWithPassword.comparePassword(password);
          if (!isPasswordValid) {
            return res.status(401).json({
              success: false,
              message: "Invalid password",
            });
          }
        }
      }
    }

    // Generate and save OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP email
    await sendOTPEmail(email, otp, user.name || "User");

    res.json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send OTP",
    });
  }
};

// Verify OTP and complete registration/login
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp, name } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please request OTP first.",
      });
    }

    // Verify OTP
    if (!user.verifyOTP(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // If it's new registration and name is provided, update it
    if (name && !user.name) {
      user.name = name;
    }

    // Mark as verified
    user.isEmailVerified = true;

    // Clear OTP and update last login
    user.clearOTP();
    user.lastLoginAt = new Date();
    user.loginHistory.push({
      loginAt: new Date(),
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"],
    });
    await user.save();

    // Generate JWT token and mark active
    const token = generateToken(user._id, user.tokenVersion || 0);
    user.token = token;
    user.isActive = true;
    await user.save();

    // Send welcome email (non-blocking, don't fail if email fails)
    const isNewUser = !user.loginHistory || user.loginHistory.length <= 1;
    if (isNewUser) {
      sendWelcomeEmail(user.email, user.name || "User").catch(err => {
        console.log("⚠️  Failed to send welcome email (non-critical):", err.message);
      });
    }

    res.json({
      success: true,
      message: "Authentication successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to verify OTP",
    });
  }
};

// Login with email and password (for already registered users)
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user and include password
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    user.loginHistory.push({
      loginAt: new Date(),
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"],
    });

    // Generate JWT token
    const token = generateToken(user._id, user.tokenVersion || 0);
    user.token = token;
    user.isActive = true;
    await user.save();

    // Send welcome email if first login (non-blocking)
    const isFirstLogin = !user.loginHistory || user.loginHistory.length === 0;
    if (isFirstLogin) {
      sendWelcomeEmail(user.email, user.name || "User").catch(err => {
        console.log("⚠️  Failed to send welcome email (non-critical):", err.message);
      });
    }

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
};

// Google OAuth routes
export const googleAuth = (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      success: false,
      message: "Google OAuth is not configured",
    });
  }
  const state = req.query.state; // allow 'ext' to signal extension flow
  return passport.authenticate("google", {
    scope: ["profile", "email"],
    state,
  })(req, res, next);
};

export const googleCallback = async (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      success: false,
      message: "Google OAuth is not configured",
    });
  }

  return passport.authenticate("google", { session: false }, async (err, user) => {
    if (err || !user) {
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}/login?error=auth_failed`);
    }

    try {
      // Update last login
      user.lastLoginAt = new Date();
      user.loginHistory.push({
        loginAt: new Date(),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers["user-agent"],
      });
      await user.save();

      // Generate JWT token
      const token = generateToken(user._id, user.tokenVersion || 0);
      user.token = token;
      user.isActive = true;
      await user.save();

      // Send welcome email if first login (non-blocking)
      const isFirstLogin = !user.loginHistory || user.loginHistory.length <= 1;
      if (isFirstLogin) {
        sendWelcomeEmail(user.email, user.name || "User").catch(err => {
          console.log("⚠️  Failed to send welcome email (non-critical):", err.message);
        });
      }

      // If extension flow, return a tiny HTML that posts the token to opener and closes
      if (req.query.state === "ext") {
        return res.send(`<!doctype html><html><body><script>
          try {
            if (window.opener) {
              window.opener.postMessage({ source: 'buddy-auth', token: '${token}', email: '${user.email}', name: ${JSON.stringify(user.name || "")} }, '*');
            }
          } catch(e) {}
          window.close();
        </script><p>You can close this window.</p></body></html>`);
      }

      // Redirect to frontend site with token
      res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/callback?token=${token}&email=${user.email}&name=${encodeURIComponent(user.name || "")}`);
    } catch (error) {
      console.error("Google callback error:", error);
      res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}/login?error=server_error`);
    }
  })(req, res, next);
};

// Get current user
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password -otp");

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get user info",
    });
  }
};

// Logout current user
export const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    user.isActive = false;
    user.token = null;
    // Invalidate all existing JWTs by bumping tokenVersion
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ success: false, message: error.message || "Logout failed" });
  }
};

