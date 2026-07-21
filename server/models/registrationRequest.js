const mongoose = require("mongoose");

const registrationRequestSchema = new mongoose.Schema({
  systemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Computer",
    required: false
  },
  hostname: {
    type: String,
    required: true
  },
  os: {
    type: String,
    required: true
  },
  osVersion: {
    type: String,
    default: ""
  },
  cpuModel: {
    type: String,
    default: ""
  },
  ram: {
    type: String,
    default: ""
  },
  storage: {
    type: String,
    default: ""
  },
  gpu: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
    index: true
  },
  tempAgentToken: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("RegistrationRequest", registrationRequestSchema);
