const mongoose = require("mongoose");

const computerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  location: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["available", "maintenance", "booked"],
    default: "available",
  },
  specifications: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Computer", computerSchema);
