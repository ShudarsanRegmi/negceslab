const mongoose = require("mongoose");

const registrationTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // Document auto-deletes when expiresAt is reached
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("RegistrationToken", registrationTokenSchema);
