const Policy = require("../models/policy");
const defaultPolicy = require("../../shared/policy");

let cachedPolicy = null;

/**
 * Normalizes DB policy to ensure property names match shared/policy format when needed
 */
const formatPolicy = (doc) => {
  if (!doc) return defaultPolicy;
  return {
    _id: doc._id,
    labOpenHour: doc.labOpenHour ?? 8,
    labOpenMinute: doc.labOpenMinute ?? 30,
    labCloseHour: doc.labCloseHour ?? 17,
    labCloseMinute: doc.labCloseMinute ?? 30,
    maxBookingDays: doc.maxBookingDays ?? 15,
    minBookingHours: doc.minBookingHours ?? 1,
    coolDownPeriodDays: doc.coolDownPeriodDays ?? 3,
    maxBookingAheadDays: doc.maxBookingAheadDays ?? 30,
    closedDays: Array.isArray(doc.closedDays) ? doc.closedDays : [0],
    // Legacy uppercase mapping for backwards compatibility with shared/policy.js
    LAB_OPEN_HOUR: doc.labOpenHour ?? 8,
    LAB_OPEN_MINUTE: doc.labOpenMinute ?? 30,
    LAB_CLOSE_HOUR: doc.labCloseHour ?? 17,
    LAB_CLOSE_MINUTE: doc.labCloseMinute ?? 30,
    MAX_BOOKING_DAYS: doc.maxBookingDays ?? 15,
    MIN_BOOKING_HOURS: doc.minBookingHours ?? 1,
    COOL_DOWN_PERIOD_DAYS: doc.coolDownPeriodDays ?? 3,
    MAX_BOOKING_AHEAD_DAYS: doc.maxBookingAheadDays ?? 30,
    CLOSED_DAYS: Array.isArray(doc.closedDays) ? doc.closedDays : [0],
    updatedAt: doc.updatedAt
  };
};

/**
 * Get active policy with in-memory RAM caching
 */
async function getPolicy() {
  if (cachedPolicy) return cachedPolicy;

  try {
    let dbPolicy = await Policy.findOne().lean();
    if (!dbPolicy) {
      dbPolicy = await Policy.create({});
      dbPolicy = dbPolicy.toObject();
    }
    cachedPolicy = formatPolicy(dbPolicy);
  } catch (err) {
    console.error("DB error fetching policy, using fallback defaults:", err);
    return formatPolicy(null);
  }

  return cachedPolicy;
}

/**
 * Update policy, persist to DB, and flush RAM cache
 */
async function updatePolicy(newSettings, adminUserId) {
  const payload = {
    labOpenHour: Number(newSettings.labOpenHour ?? newSettings.LAB_OPEN_HOUR ?? 8),
    labOpenMinute: Number(newSettings.labOpenMinute ?? newSettings.LAB_OPEN_MINUTE ?? 30),
    labCloseHour: Number(newSettings.labCloseHour ?? newSettings.LAB_CLOSE_HOUR ?? 17),
    labCloseMinute: Number(newSettings.labCloseMinute ?? newSettings.LAB_CLOSE_MINUTE ?? 30),
    maxBookingDays: Number(newSettings.maxBookingDays ?? newSettings.MAX_BOOKING_DAYS ?? 15),
    minBookingHours: Number(newSettings.minBookingHours ?? newSettings.MIN_BOOKING_HOURS ?? 1),
    coolDownPeriodDays: Number(newSettings.coolDownPeriodDays ?? newSettings.COOL_DOWN_PERIOD_DAYS ?? 3),
    maxBookingAheadDays: Number(newSettings.maxBookingAheadDays ?? newSettings.MAX_BOOKING_AHEAD_DAYS ?? 30),
    closedDays: Array.isArray(newSettings.closedDays ?? newSettings.CLOSED_DAYS) 
      ? (newSettings.closedDays ?? newSettings.CLOSED_DAYS).map(Number) 
      : [0],
    updatedBy: adminUserId,
    updatedAt: new Date()
  };

  const updated = await Policy.findOneAndUpdate(
    {},
    payload,
    { new: true, upsert: true }
  ).lean();

  cachedPolicy = formatPolicy(updated);
  return cachedPolicy;
}

module.exports = {
  getPolicy,
  updatePolicy
};
