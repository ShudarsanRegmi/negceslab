require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/user");

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not defined in .env file");
  process.exit(1);
}

async function makeAdmin() {
  try {
    // Initialize Firebase Admin
    const admin = require("firebase-admin");
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./config/serviceAccountKey.json";
    
    if (!admin.apps.length) {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Get admin email from environment variable
    const adminEmail = process.env.SMTP_USER;
    if (!adminEmail) {
      console.error("SMTP_USER is not defined in .env file");
      process.exit(1);
    }

    console.log(`Searching for user with email: ${adminEmail} in Firebase...`);

    // Search for user in Firebase by email
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUserByEmail(adminEmail);
      console.log(`Found Firebase user: ${firebaseUser.uid}`);
    } catch (firebaseError) {
      console.error(`User ${adminEmail} not found in Firebase. Please ensure the user is registered in Firebase first.`);
      process.exit(1);
    }

    // Check if user already exists in MongoDB and update role
    let result = await User.findOneAndUpdate(
      { email: adminEmail },
      { 
        role: "admin",
        firebaseUid: firebaseUser.uid,
        name: "Admin User"
      },
      { new: true }
    );

    if (result) {
      console.log("Successfully updated existing user to admin:", {
        email: result.email,
        name: result.name,
        role: result.role,
        firebaseUid: result.firebaseUid
      });
    } else {
      // Create new admin user in MongoDB
      console.log("Creating new admin user in MongoDB...");
      const adminUser = new User({
        firebaseUid: firebaseUser.uid,
        email: adminEmail,
        name: firebaseUser.displayName || "Admin User",
        role: "admin",
      });

      result = await adminUser.save();
      console.log("Successfully created new admin user:", {
        email: result.email,
        name: result.name,
        role: result.role,
        firebaseUid: result.firebaseUid
      });
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

makeAdmin();
