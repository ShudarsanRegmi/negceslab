const express = require("express");
const router = express.Router();
const Booking = require("../models/booking");
const User = require("../models/user");
const CooldownWaiver = require("../models/cooldownWaiver");
const { verifyToken, isAdmin } = require("../middleware/auth");
const { getPolicy, calculateCoolDownDays } = require("../services/policyService");
const getLogger = require("../utils/logger");
const logger = getLogger("cooldowns");

// Helper: Check if user has an active waiver covering their current cool-down
async function getUserActiveWaiver(userId, lastBookingEndDate) {
  if (!lastBookingEndDate) return null;
  const lastEndDateObj = new Date(lastBookingEndDate + "T00:00:00");
  
  // Find any waiver granted after or on the day of the last booking's end date
  const waiver = await CooldownWaiver.findOne({
    userId,
    waivedAt: { $gte: lastEndDateObj }
  }).sort({ waivedAt: -1 });

  return waiver;
}

// GET /api/cooldowns/active - List all users currently in an active cool-down period
router.get("/active", verifyToken, isAdmin, async (req, res) => {
  try {
    const policy = await getPolicy();
    
    // Find all users who have approved or completed bookings
    const bookings = await Booking.find({
      status: { $in: ["approved", "completed"] }
    }).sort({ endDate: -1 });

    // Group by userId to get each user's latest booking
    const latestUserBookingsMap = new Map();
    for (const booking of bookings) {
      if (!latestUserBookingsMap.has(booking.userId)) {
        latestUserBookingsMap.set(booking.userId, booking);
      }
    }

    const now = new Date();
    const activeCoolDowns = [];

    for (const [userId, latestBooking] of latestUserBookingsMap.entries()) {
      const prevStartObj = new Date(latestBooking.startDate + "T00:00:00");
      const prevEndObj = new Date(latestBooking.endDate + "T00:00:00");
      const prevDurationDays = Math.max(1, Math.ceil((prevEndObj - prevStartObj) / (1000 * 60 * 60 * 24)) + 1);

      const { coolDownDays, tierName } = calculateCoolDownDays(prevDurationDays, policy);

      if (coolDownDays > 0) {
        const coolDownExpiryObj = new Date(prevEndObj);
        coolDownExpiryObj.setDate(coolDownExpiryObj.getDate() + coolDownDays);
        coolDownExpiryObj.setHours(23, 59, 59, 999);

        // If today is within cool-down window
        if (now <= coolDownExpiryObj) {
          // Check if admin has already waived this cool-down
          const activeWaiver = await getUserActiveWaiver(userId, latestBooking.endDate);
          if (!activeWaiver) {
            // Get user details
            const userDoc = await User.findOne({ firebaseUid: userId }).select("name email").lean();
            const eligibleDateObj = new Date(coolDownExpiryObj);
            eligibleDateObj.setDate(eligibleDateObj.getDate() + 1);

            activeCoolDowns.push({
              userId,
              userName: userDoc?.name || "User",
              userEmail: userDoc?.email || userId,
              tierName,
              lastBookingId: latestBooking._id,
              lastBookingEndDate: latestBooking.endDate,
              lastBookingDurationDays: prevDurationDays,
              coolDownDays,
              coolDownExpiryDate: coolDownExpiryObj.toISOString().split("T")[0],
              eligibleDate: eligibleDateObj.toISOString().split("T")[0]
            });
          }
        }
      }
    }

    res.json(activeCoolDowns);
  } catch (error) {
    logger.error("Error fetching active cool-downs", { error: error.message });
    res.status(500).json({ message: "Error fetching active cool-downs", error: error.message });
  }
});

// POST /api/cooldowns/waive - Waive cool-down period for a specific user (Admin only)
router.post("/waive", verifyToken, isAdmin, async (req, res) => {
  try {
    const { targetUserId, reason, tierName, lastBookingEndDate } = req.body;

    if (!targetUserId || !reason || reason.trim().length < 5) {
      return res.status(400).json({ message: "Mandatory justification reason required (minimum 5 characters)." });
    }

    const targetUser = await User.findOne({ firebaseUid: targetUserId }).lean();
    if (!targetUser) {
      return res.status(404).json({ message: "Target user profile not found." });
    }

    const waiver = await CooldownWaiver.create({
      userId: targetUserId,
      userName: targetUser.name || targetUser.email.split("@")[0],
      userEmail: targetUser.email,
      waivedByAdminId: req.user.firebaseUid,
      waivedByAdminEmail: req.user.email,
      waivedByAdminName: req.user.name || req.user.email.split("@")[0],
      reason: reason.trim(),
      tierName: tierName || "Waived Tier",
      originalCoolDownExpiry: lastBookingEndDate || "",
      waivedAt: new Date()
    });

    logger.info("Cool-down period waived by admin", {
      targetUser: targetUser.email,
      admin: req.user.email,
      reason: reason.trim()
    });

    res.json({
      message: `Cool-down period successfully waived for ${targetUser.email}.`,
      waiver
    });
  } catch (error) {
    logger.error("Error waiving cool-down", { error: error.message });
    res.status(500).json({ message: "Failed to waive cool-down period", error: error.message });
  }
});

// GET /api/cooldowns/logs - Get log history of all waived cool-downs
router.get("/logs", verifyToken, isAdmin, async (req, res) => {
  try {
    const logs = await CooldownWaiver.find().sort({ waivedAt: -1 }).lean();
    res.json(logs);
  } catch (error) {
    logger.error("Error fetching cool-down logs", { error: error.message });
    res.status(500).json({ message: "Error fetching cool-down logs", error: error.message });
  }
});

// GET /api/cooldowns/metrics - Get metrics for waived cool-downs
router.get("/metrics", verifyToken, isAdmin, async (req, res) => {
  try {
    const totalWaivedCount = await CooldownWaiver.countDocuments();
    const recentWaivers = await CooldownWaiver.find().sort({ waivedAt: -1 }).limit(5).lean();
    const waivedBookingsCount = await Booking.countDocuments({ isWaivedCoolDown: true });

    // Group waivers by target user for frequency metrics
    const userWaiverCounts = await CooldownWaiver.aggregate([
      {
        $group: {
          _id: "$userEmail",
          userName: { $first: "$userName" },
          count: { $sum: 1 },
          lastWaivedAt: { $max: "$waivedAt" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      totalWaivedCount,
      waivedBookingsCount,
      recentWaivers,
      userWaiverCounts
    });
  } catch (error) {
    logger.error("Error fetching cool-down metrics", { error: error.message });
    res.status(500).json({ message: "Error fetching cool-down metrics", error: error.message });
  }
});

module.exports = router;
