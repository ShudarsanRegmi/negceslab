const Policy = require("../models/policy");

const defaultPolicy = {
  labOpenHour: 8,
  labOpenMinute: 30,
  labCloseHour: 17,
  labCloseMinute: 30,
  maxBookingDays: 15,
  minBookingHours: 1,
  coolDownPeriodDays: 3,
  shortTierMaxDays: 5,
  mediumTierMaxDays: 10,
  mediumTierCoolDownDays: 5,
  longTierCoolDownDays: 10,
  maxBookingAheadDays: 30,
  closedDays: [0],
  LAB_OPEN_HOUR: 8,
  LAB_OPEN_MINUTE: 30,
  LAB_CLOSE_HOUR: 17,
  LAB_CLOSE_MINUTE: 30,
  MAX_BOOKING_DAYS: 15,
  MIN_BOOKING_HOURS: 1,
  COOL_DOWN_PERIOD_DAYS: 3,
  SHORT_TIER_MAX_DAYS: 5,
  MEDIUM_TIER_MAX_DAYS: 10,
  MEDIUM_TIER_COOL_DOWN_DAYS: 5,
  LONG_TIER_COOL_DOWN_DAYS: 10,
  MAX_BOOKING_AHEAD_DAYS: 30,
  CLOSED_DAYS: [0],
};

let cachedPolicy = null;

/**
 * Calculates cool-down days required for a given booking duration based on tiered policy
 * @param {number} bookingDurationDays - Duration of the completed/previous booking in days
 * @param {object} policy - Active policy configuration
 * @returns {{ coolDownDays: number, tierName: string }}
 */
function calculateCoolDownDays(bookingDurationDays, policy) {
  const p = policy || defaultPolicy;
  const shortMax = Number(p.shortTierMaxDays ?? 5);
  const mediumMax = Number(p.mediumTierMaxDays ?? 10);
  const mediumCool = Number(p.mediumTierCoolDownDays ?? 5);
  const longCool = Number(p.longTierCoolDownDays ?? 10);

  if (bookingDurationDays <= shortMax) {
    return { coolDownDays: 0, tierName: "Short Booking (≤ " + shortMax + " days)" };
  } else if (bookingDurationDays <= mediumMax) {
    return { coolDownDays: mediumCool, tierName: "Medium Booking (" + (shortMax + 1) + "–" + mediumMax + " days)" };
  } else {
    return { coolDownDays: longCool, tierName: "Long Booking (>" + mediumMax + " days)" };
  }
}

/**
 * Normalizes DB policy to ensure property names match both camelCase and UPPERCASE formats
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
    shortTierMaxDays: doc.shortTierMaxDays ?? 5,
    mediumTierMaxDays: doc.mediumTierMaxDays ?? 10,
    mediumTierCoolDownDays: doc.mediumTierCoolDownDays ?? 5,
    longTierCoolDownDays: doc.longTierCoolDownDays ?? 10,
    maxBookingAheadDays: doc.maxBookingAheadDays ?? 30,
    closedDays: Array.isArray(doc.closedDays) ? doc.closedDays : [0],
    // Legacy / UPPERCASE mapping
    LAB_OPEN_HOUR: doc.labOpenHour ?? 8,
    LAB_OPEN_MINUTE: doc.labOpenMinute ?? 30,
    LAB_CLOSE_HOUR: doc.labCloseHour ?? 17,
    LAB_CLOSE_MINUTE: doc.labCloseMinute ?? 30,
    MAX_BOOKING_DAYS: doc.maxBookingDays ?? 15,
    MIN_BOOKING_HOURS: doc.minBookingHours ?? 1,
    COOL_DOWN_PERIOD_DAYS: doc.coolDownPeriodDays ?? 3,
    SHORT_TIER_MAX_DAYS: doc.shortTierMaxDays ?? 5,
    MEDIUM_TIER_MAX_DAYS: doc.mediumTierMaxDays ?? 10,
    MEDIUM_TIER_COOL_DOWN_DAYS: doc.mediumTierCoolDownDays ?? 5,
    LONG_TIER_COOL_DOWN_DAYS: doc.longTierCoolDownDays ?? 10,
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
  const shortTierMax = Number(newSettings.shortTierMaxDays ?? newSettings.SHORT_TIER_MAX_DAYS ?? 5);
  const mediumTierMax = Number(newSettings.mediumTierMaxDays ?? newSettings.MEDIUM_TIER_MAX_DAYS ?? 10);
  const maxBooking = Number(newSettings.maxBookingDays ?? newSettings.MAX_BOOKING_DAYS ?? 15);
  const mediumCool = Number(newSettings.mediumTierCoolDownDays ?? newSettings.MEDIUM_TIER_COOL_DOWN_DAYS ?? 5);
  const longCool = Number(newSettings.longTierCoolDownDays ?? newSettings.LONG_TIER_COOL_DOWN_DAYS ?? 10);

  // Enforce ordering validation
  if (shortTierMax >= mediumTierMax) {
    throw new Error(`Short tier max (${shortTierMax}d) must be strictly less than Medium tier max (${mediumTierMax}d).`);
  }
  if (mediumTierMax >= maxBooking) {
    throw new Error(`Medium tier max (${mediumTierMax}d) must be strictly less than Max booking days (${maxBooking}d).`);
  }
  if (mediumCool > longCool) {
    throw new Error(`Medium tier cool-down (${mediumCool}d) cannot exceed Long tier cool-down (${longCool}d).`);
  }

  const payload = {
    labOpenHour: Number(newSettings.labOpenHour ?? newSettings.LAB_OPEN_HOUR ?? 8),
    labOpenMinute: Number(newSettings.labOpenMinute ?? newSettings.LAB_OPEN_MINUTE ?? 30),
    labCloseHour: Number(newSettings.labCloseHour ?? newSettings.LAB_CLOSE_HOUR ?? 17),
    labCloseMinute: Number(newSettings.labCloseMinute ?? newSettings.LAB_CLOSE_MINUTE ?? 30),
    maxBookingDays: maxBooking,
    minBookingHours: Number(newSettings.minBookingHours ?? newSettings.MIN_BOOKING_HOURS ?? 1),
    coolDownPeriodDays: Number(newSettings.coolDownPeriodDays ?? newSettings.COOL_DOWN_PERIOD_DAYS ?? 3),
    shortTierMaxDays: shortTierMax,
    mediumTierMaxDays: mediumTierMax,
    mediumTierCoolDownDays: mediumCool,
    longTierCoolDownDays: longCool,
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
  updatePolicy,
  calculateCoolDownDays
};
