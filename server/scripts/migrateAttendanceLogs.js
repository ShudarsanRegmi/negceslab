require("dotenv").config();
const mongoose = require("mongoose");
const crypto = require("crypto");
const Booking = require("../models/booking");
const AttendanceLog = require("../models/attendanceLog");
const Computer = require("../models/computer");

async function migrateAttendanceLogs() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("MONGODB_URI is not set in environment");
      process.exit(1);
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("Connected to MongoDB.");

    const bookings = await Booking.find({
      attendanceHistory: { $exists: true, $not: { $size: 0 } }
    });

    console.log(`Found ${bookings.length} bookings containing historical attendance logs.`);
    let migratedCount = 0;
    let skippedCount = 0;

    for (const booking of bookings) {
      if (!booking.attendanceHistory || !Array.isArray(booking.attendanceHistory)) continue;

      for (const entry of booking.attendanceHistory) {
        if (!entry.currentUser && !entry.email) continue;

        // Formulate timestamp
        let checkInDate = entry.checkInTime ? new Date(entry.checkInTime) : new Date(entry.date);
        let checkOutDate = entry.checkOutTime ? new Date(entry.checkOutTime) : null;
        
        const existing = await AttendanceLog.findOne({
          bookingId: booking._id,
          studentEmail: entry.email || entry.currentUser,
          checkInTime: checkInDate
        });

        if (existing) {
          skippedCount++;
          continue;
        }

        const durationMinutes = checkOutDate
          ? Math.max(1, Math.round((checkOutDate - checkInDate) / 60000))
          : 0;

        const sessionId = crypto.randomBytes(16).toString("hex");

        const log = new AttendanceLog({
          sessionId,
          computerId: booking.computerId,
          bookingId: booking._id,
          studentName: entry.currentUser || "Student",
          studentEmail: entry.email || `${entry.currentUser || 'student'}@amrita.edu`,
          agenda: entry.agenda || booking.title || "General Work",
          sessionType: entry.sessionType || "Physical GUI",
          entryType: "RESERVED_BOOKING",
          osType: "unknown",
          checkInTime: checkInDate,
          checkOutTime: checkOutDate,
          durationMinutes,
          sessionStatus: checkOutDate ? "COMPLETED" : "ACTIVE",
          segments: [{
            checkIn: checkInDate,
            checkOut: checkOutDate,
            osType: "unknown",
            reason: "INITIAL"
          }]
        });

        await log.save();
        migratedCount++;
      }
    }

    console.log(`Migration Complete: Migrated ${migratedCount} attendance records, skipped ${skippedCount} existing records.`);
    process.exit(0);
  } catch (err) {
    console.error("Migration Error:", err);
    process.exit(1);
  }
}

migrateAttendanceLogs();
