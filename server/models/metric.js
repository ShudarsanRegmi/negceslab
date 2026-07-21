const mongoose = require("mongoose");

const metricSchema = new mongoose.Schema({
  computerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Computer",
    required: true,
    index: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  cpuUtil: { type: Number, default: 0 },
  ramUtil: { type: Number, default: 0 },
  gpuUtil: { type: Number, default: 0 },
  gpuMemUsed: { type: Number, default: 0 },
  gpuMemTotal: { type: Number, default: 0 },
  netSentSpeed: { type: Number, default: 0 },
  netRecvSpeed: { type: Number, default: 0 },
  diskUtil: { type: Number, default: 0 },
  cpuTemp: { type: Number, default: 0 },
  gpuTemp: { type: Number, default: 0 },
});

// Auto-delete records older than 7 days to preserve storage space
metricSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

module.exports = mongoose.model("Metric", metricSchema);
