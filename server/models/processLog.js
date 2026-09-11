const mongoose = require("mongoose");

const processItemSchema = new mongoose.Schema({
  pid: Number,
  name: String,
  username: String,
  cpu_util: Number,
  ram_util: Number,
  ram_used_bytes: Number,
  cmdline: String
});

const processLogSchema = new mongoose.Schema({
  computerId: { type: mongoose.Schema.Types.ObjectId, ref: "Computer", required: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  triggerReason: { type: String, enum: ["PERIODIC", "SPIKE", "ON_DEMAND"], default: "PERIODIC" },
  topProcesses: [processItemSchema]
});

// Automatically expire process log snapshots after 7 days
processLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

module.exports = mongoose.model("ProcessLog", processLogSchema);
