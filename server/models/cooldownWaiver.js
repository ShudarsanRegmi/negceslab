const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cooldownWaiverSchema = new Schema({
  userId: { type: String, required: true }, // Firebase UID or Mongo ID
  userName: { type: String, default: "" },
  userEmail: { type: String, default: "" },
  waivedByAdminId: { type: String, required: true },
  waivedByAdminEmail: { type: String, required: true },
  waivedByAdminName: { type: String, default: "" },
  reason: { type: String, required: true },
  tierName: { type: String, default: "" },
  originalCoolDownExpiry: { type: String, default: "" },
  waivedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CooldownWaiver", cooldownWaiverSchema);
