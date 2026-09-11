const express = require("express");
const router = express.Router();
const AttendanceLog = require("../models/attendanceLog");
const Computer = require("../models/computer");
const { verifyToken, isAdmin } = require("../middleware/auth");
const getLogger = require("../utils/logger");
const logger = getLogger("attendance");

// 1. GET /api/attendance/logs - Filtered & Paginated Attendance History for Admin Dashboard
router.get("/logs", verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;

    const {
      computerId,
      studentEmail,
      search,
      entryType,
      osType,
      sessionStatus,
      startDate,
      endDate
    } = req.query;

    const queryFilter = {};

    if (computerId) {
      queryFilter.computerId = computerId;
    }

    if (studentEmail) {
      queryFilter.studentEmail = new RegExp(studentEmail, "i");
    }

    if (entryType && entryType !== "ALL") {
      queryFilter.entryType = entryType;
    }

    if (osType && osType !== "ALL") {
      queryFilter.osType = osType;
    }

    if (sessionStatus && sessionStatus !== "ALL") {
      queryFilter.sessionStatus = sessionStatus;
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      queryFilter.$or = [
        { studentName: searchRegex },
        { studentEmail: searchRegex },
        { agenda: searchRegex },
        { osHostname: searchRegex },
        { macAddress: searchRegex }
      ];
    }

    if (startDate && endDate) {
      const start = new Date(`${startDate}T00:00:00.000Z`);
      const end = new Date(`${endDate}T23:59:59.999Z`);
      queryFilter.checkInTime = { $gte: start, $lte: end };
    } else if (startDate) {
      const start = new Date(`${startDate}T00:00:00.000Z`);
      queryFilter.checkInTime = { $gte: start };
    } else if (endDate) {
      const end = new Date(`${endDate}T23:59:59.999Z`);
      queryFilter.checkInTime = { $lte: end };
    }

    const total = await AttendanceLog.countDocuments(queryFilter);

    const logs = await AttendanceLog.find(queryFilter)
      .sort({ checkInTime: -1 })
      .skip(skip)
      .limit(limit)
      .populate("computer", "name location systemDetails agentSystemDetails status")
      .populate("booking", "title startTime endTime status");

    // Aggregate summary stats for quick admin overview
    const stats = {
      total,
      active: await AttendanceLog.countDocuments({ ...queryFilter, sessionStatus: "ACTIVE" }),
      walkIns: await AttendanceLog.countDocuments({ ...queryFilter, entryType: "WALK_IN" }),
      reserved: await AttendanceLog.countDocuments({ ...queryFilter, entryType: "RESERVED_BOOKING" })
    };

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      stats
    });
  } catch (error) {
    logger.error("Failed to fetch attendance logs", { error: error.message });
    res.status(500).json({ message: "Failed to fetch attendance history", error: error.message });
  }
});

// 2. GET /api/attendance/logs/:sessionId - Detailed session view
router.get("/logs/:sessionId", verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const log = await AttendanceLog.findOne({ sessionId })
      .populate("computer")
      .populate("booking");

    if (!log) {
      return res.status(404).json({ message: "Attendance session log not found" });
    }

    res.json({ success: true, data: log });
  } catch (error) {
    logger.error("Failed to fetch session detail", { error: error.message });
    res.status(500).json({ message: "Failed to fetch session detail", error: error.message });
  }
});

// 3. POST /api/attendance/admin-terminate/:sessionId - Admin force-end stuck session
router.post("/admin-terminate/:sessionId", verifyToken, isAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const log = await AttendanceLog.findOne({ sessionId });

    if (!log) {
      return res.status(404).json({ message: "Attendance session not found" });
    }

    log.sessionStatus = "ADMIN_TERMINATED";
    log.checkOutTime = new Date();
    log.durationMinutes = Math.round((log.checkOutTime - log.checkInTime) / 60000);
    await log.save();

    // Release computer if active
    const computer = await Computer.findById(log.computerId);
    if (computer && computer.agentActiveSession?.sessionId === sessionId) {
      const prevSession = computer.agentActiveSession || {};
      computer.agentActiveSession = {
        currentUser: "",
        email: "",
        agenda: "",
        sessionType: "",
        checkInTime: null,
        checkedIn: false,
        activeBookingId: null,
        sessionId: null,
        lastSession: {
          currentUser: prevSession.currentUser || log.studentName || "",
          email: prevSession.email || log.studentEmail || "",
          agenda: prevSession.agenda || log.agenda || "",
          sessionType: prevSession.sessionType || log.sessionType || "",
          checkInTime: prevSession.checkInTime || log.checkInTime || null,
          checkOutTime: log.checkOutTime || new Date(),
          totalCheckInsToday: 1
        }
      };
      computer.status = "available";
      await computer.save();

      const { broadcastSystemStateChange } = require("../services/websocketService");
      broadcastSystemStateChange(computer._id, { status: computer.status, agentActiveSession: computer.agentActiveSession });
    }

    res.json({ success: true, message: "Attendance session terminated by administrator", data: log });
  } catch (error) {
    logger.error("Failed to terminate attendance session", { error: error.message });
    res.status(500).json({ message: "Failed to terminate session", error: error.message });
  }
});

module.exports = router;
