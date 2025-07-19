const admin = require("firebase-admin");
const User = require("../models/user");

// Verify Firebase token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);

    // Get user role from MongoDB
    const userDoc = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    // Combine Firebase user data with MongoDB user data
    req.user = {
      ...userDoc.toObject(),
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
    };

    req.userRole = userDoc.role;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.userRole !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// Check if user is a regular user
const isUser = (req, res, next) => {
  if (!["user", "admin"].includes(req.userRole)) {
    return res.status(403).json({ message: "User access required" });
  }
  next();
};

module.exports = {
  verifyToken,
  isAdmin,
  isUser,
};
