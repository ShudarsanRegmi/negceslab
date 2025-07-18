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

    const result = await User.findOneAndUpdate(
      { email: "admin@negsus.com" },
      { role: "admin" },
      { new: true }
    );

    if (result) {
      console.log("Successfully updated user role to admin:", result);
    } else {
      console.log("User not found");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

makeAdmin();
