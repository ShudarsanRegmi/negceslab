require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/user");

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not defined in .env file");
  process.exit(1);
}

async function makeAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // First, try to find and update existing user
    let result = await User.findOneAndUpdate(
      { email: "admin@negsus.com" },
      { role: "admin" },
      { new: true }
    );

    if (result) {
      console.log("Successfully updated user role to admin:", result);
    } else {
      // If user doesn't exist, create a new admin user
      console.log("User not found, creating new admin user...");

      // You'll need to provide the Firebase UID for your admin user
      // Get this from Firebase Console -> Authentication -> Users
      const adminUser = new User({
        firebaseUid: "f8Y0GnDw66b4uFqGIevr1hvObz92", // Replace with actual UID from Firebase Console
        email: "admin@negsus.com",
        name: "Admin User",
        role: "admin",
      });

      result = await adminUser.save();
      console.log("Successfully created new admin user:", result);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

makeAdmin();
