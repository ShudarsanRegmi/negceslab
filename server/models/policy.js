const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const policySchema = new Schema({
  labOpenHour: { type: Number, default: 8 },
  labOpenMinute: { type: Number, default: 30 },
  labCloseHour: { type: Number, default: 17 },
  labCloseMinute: { type: Number, default: 30 },
  maxBookingDays: { type: Number, default: 15 },
  minBookingHours: { type: Number, default: 1 },
  coolDownPeriodDays: { type: Number, default: 3 }, // Cool-Down Period in Days
  maxBookingAheadDays: { type: Number, default: 30 },
  closedDays: { type: [Number], default: [0] }, // 0 = Sunday
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Policy", policySchema);
