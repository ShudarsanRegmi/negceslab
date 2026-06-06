const crypto = require("crypto");
const express = require("express");
const User = require("../models/user");
const { sendSuperadminOtpEmail } = require("../services/emailService");

const router = express.Router();

const OTP_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 15 * 60 * 1000;
const otpStore = new Map();
const sessionStore = new Map();

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const getAllowedSuperadminEmails = () =>
  (process.env.SUPERADMIN_EMAILS || process.env.SUPERADMIN_EMAIL || "")
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean);

const cleanupExpired = (store) => {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (value.expiresAt <= now) {
      store.delete(key);
    }
  }
};

const isAllowedSuperadmin = (email) => {
  const allowedEmails = getAllowedSuperadminEmails();
  return allowedEmails.includes(normalizeEmail(email));
};

const hashSecret = (secret) =>
  crypto.createHash("sha256").update(secret).digest("hex");

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

const requireSuperadminSession = (req, res, next) => {
  cleanupExpired(sessionStore);

  const token = req.headers["x-superadmin-session"];
  if (!token || typeof token !== "string") {
    return res.status(401).json({ message: "Superadmin session required" });
  }

  const session = sessionStore.get(hashSecret(token));
  if (!session || session.expiresAt <= Date.now()) {
    return res.status(401).json({ message: "Superadmin session expired" });
  }

  req.superadmin = {
    email: session.email,
    expiresAt: session.expiresAt,
  };
  next();
};

router.post("/request-otp", async (req, res) => {
  try {
    cleanupExpired(otpStore);
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!isAllowedSuperadmin(email)) {
      return res.status(403).json({ message: "This email is not allowed for superadmin login" });
    }

    const existingOtp = otpStore.get(email);
    if (existingOtp?.lastSentAt && Date.now() - existingOtp.lastSentAt < 30 * 1000) {
      return res.status(429).json({ message: "Please wait before requesting another OTP" });
    }

    const otp = generateOtp();
    const expiresAt = Date.now() + OTP_TTL_MS;
    otpStore.set(email, {
      otpHash: hashSecret(otp),
      expiresAt,
      attempts: 0,
      lastSentAt: Date.now(),
    });

    const result = await sendSuperadminOtpEmail(email, otp, Math.floor(OTP_TTL_MS / 60000));
    if (!result.success) {
      if (process.env.SUPERADMIN_OTP_DEBUG === "true" && process.env.NODE_ENV !== "production") {
        console.log(`Superadmin OTP for ${email}: ${otp}`);
      } else {
        otpStore.delete(email);
        return res.status(500).json({ message: "Failed to send OTP email" });
      }
    }

    res.json({
      message: result.success
        ? "OTP sent to the configured superadmin email"
        : "OTP generated. Check the backend console because SUPERADMIN_OTP_DEBUG is enabled",
      expiresAt: new Date(expiresAt).toISOString(),
    });
  } catch (error) {
    console.error("Superadmin request OTP error:", error);
    res.status(500).json({ message: "Error sending OTP" });
  }
});

router.post("/verify-otp", (req, res) => {
  try {
    cleanupExpired(otpStore);
    cleanupExpired(sessionStore);

    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    if (!isAllowedSuperadmin(email)) {
      return res.status(403).json({ message: "This email is not allowed for superadmin login" });
    }

    const record = otpStore.get(email);
    if (!record || record.expiresAt <= Date.now()) {
      return res.status(400).json({ message: "OTP expired. Please request a new one" });
    }

    if (record.attempts >= 5) {
      otpStore.delete(email);
      return res.status(429).json({ message: "Too many OTP attempts. Please request a new OTP" });
    }

    record.attempts += 1;
    if (record.otpHash !== hashSecret(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    otpStore.delete(email);

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + SESSION_TTL_MS;
    sessionStore.set(hashSecret(token), { email, expiresAt });

    res.json({
      token,
      email,
      expiresAt: new Date(expiresAt).toISOString(),
      ttlSeconds: Math.floor(SESSION_TTL_MS / 1000),
    });
  } catch (error) {
    console.error("Superadmin verify OTP error:", error);
    res.status(500).json({ message: "Error verifying OTP" });
  }
});

router.post("/logout", requireSuperadminSession, (req, res) => {
  const token = req.headers["x-superadmin-session"];
  sessionStore.delete(hashSecret(token));
  res.json({ message: "Logged out" });
});

router.get("/me", requireSuperadminSession, (req, res) => {
  res.json({
    email: req.superadmin.email,
    expiresAt: new Date(req.superadmin.expiresAt).toISOString(),
  });
});

router.get("/stats", requireSuperadminSession, async (req, res) => {
  try {
    const [userCount, adminCount, totalCount] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments(),
    ]);

    res.json({ userCount, adminCount, totalCount });
  } catch (error) {
    console.error("Superadmin stats error:", error);
    res.status(500).json({ message: "Error loading stats" });
  }
});

router.get("/admins", requireSuperadminSession, async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" })
      .select("_id name email role createdAt")
      .sort({ createdAt: -1 });
    res.json(admins);
  } catch (error) {
    console.error("Superadmin admins error:", error);
    res.status(500).json({ message: "Error loading admins" });
  }
});

router.get("/users/search", requireSuperadminSession, async (req, res) => {
  try {
    const email = normalizeEmail(req.query.email);
    if (!email || email.length < 3) {
      return res.status(400).json({ message: "Enter at least 3 characters to search" });
    }

    const users = await User.find({ email: { $regex: email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } })
      .select("_id name email role createdAt")
      .sort({ email: 1 })
      .limit(10);

    res.json(users);
  } catch (error) {
    console.error("Superadmin user search error:", error);
    res.status(500).json({ message: "Error searching users" });
  }
});

router.post("/admins", requireSuperadminSession, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No registered user found with this email" });
    }

    user.role = "admin";
    await user.save();
    res.json(user);
  } catch (error) {
    console.error("Superadmin promote admin error:", error);
    res.status(500).json({ message: "Error making user admin" });
  }
});

router.delete("/admins/:userId", requireSuperadminSession, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "Admin user not found" });
    }

    user.role = "user";
    await user.save();
    res.json(user);
  } catch (error) {
    console.error("Superadmin revoke admin error:", error);
    res.status(500).json({ message: "Error revoking admin access" });
  }
});

module.exports = router;
