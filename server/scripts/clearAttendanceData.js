const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const AttendanceLog = require("../models/attendanceLog");
const Booking = require("../models/booking");
const Computer = require("../models/computer");

async function clearAttendanceData() {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/negceslab";
    console.log("Connecting to MongoDB at:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    // 1. Delete all AttendanceLog records
    const deleteResult = await AttendanceLog.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} AttendanceLog documents.`);

    // 2. Clear attendanceHistory array from all Bookings
    const bookingResult = await Booking.updateMany({}, { $set: { attendanceHistory: [] } });
    console.log(`Cleared attendanceHistory for ${bookingResult.modifiedCount} bookings.`);

    // 3. Reset agentActiveSession for all Computers
    const computerResult = await Computer.updateMany(
      {},
      {
        $set: {
          status: "available",
          agentActiveSession: {
            currentUser: "",
            email: "",
            agenda: "",
            sessionType: "",
            checkInTime: null,
            checkedIn: false,
            activeBookingId: null,
            sessionId: null,
            lastSession: {
              currentUser: "",
              email: "",
              agenda: "",
              sessionType: "",
              checkInTime: null,
              checkOutTime: null,
              totalCheckInsToday: 0
            }
          }
        }
      }
    );
    console.log(`Reset agentActiveSession for ${computerResult.modifiedCount} computers.`);

    console.log("All attendance submissions have been successfully cleared!");
    process.exit(0);
  } catch (error) {
    console.error("Error clearing attendance data:", error);
    process.exit(1);
  }
}

clearAttendanceData();
