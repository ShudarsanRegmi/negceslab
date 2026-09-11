const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");
const router = express.Router();
const Computer = require("../models/computer");
const Metric = require("../models/metric");
const Booking = require("../models/booking");
const AttendanceLog = require("../models/attendanceLog");
const { writeMetricPoint, writeMetricPointsBatch, queryMetrics } = require("../services/influxService");
const logger = require("../utils/logger")("agent");

// Middleware to verify the agent's secure token
const verifyAgentToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Agent authorization required" });
    }
    const token = authHeader.split(" ")[1];
    
    // Find computer with matching agentToken
    const computer = await Computer.findOne({ agentToken: token });
    if (!computer) {
      return res.status(403).json({ message: "Invalid agent token" });
    }
    
    req.computer = computer;
    next();
  } catch (error) {
    console.error("Agent Auth Error:", error);
    res.status(500).json({ message: "Internal server auth error" });
  }
};

const RegistrationToken = require("../models/registrationToken");
const RegistrationRequest = require("../models/registrationRequest");

// 1. Machine Registration Endpoint (Requires 30-min window token check & queues approval request)
router.post("/register", async (req, res) => {
  try {
    const clientToken = req.headers["x-registration-token"] || req.body.registrationToken;
    if (!clientToken) {
      return res.status(401).json({ message: "Unauthorized: Missing active registration token" });
    }

    // Verify token exists and is valid in database
    const tokenDoc = await RegistrationToken.findOne({ token: clientToken });
    if (!tokenDoc) {
      return res.status(401).json({ message: "Unauthorized: Invalid or expired registration token" });
    }

    const { systemId, hostname, os, osVersion, cpuModel, ram, storage, gpu } = req.body;

    if (!systemId || !mongoose.Types.ObjectId.isValid(systemId)) {
      return res.status(400).json({ message: "A valid systemId is required for registration" });
    }

    // Check if there is already an active registration token cached on target computer
    const existingComputer = await Computer.findById(systemId);
    if (!existingComputer) {
      return res.status(404).json({ message: "Target system not found in database" });
    }

    // Check for existing request from this system
    let pendingRequest = await RegistrationRequest.findOne({
      systemId: systemId,
      status: "pending"
    });

    const tempAgentToken = crypto.randomBytes(32).toString("hex");

    if (pendingRequest) {
      // Update pending request specs
      pendingRequest.hostname = existingComputer.name;
      pendingRequest.os = os || "Other";
      pendingRequest.osVersion = osVersion || "";
      pendingRequest.cpuModel = cpuModel || "";
      pendingRequest.ram = ram || "";
      pendingRequest.storage = storage || "";
      pendingRequest.gpu = gpu || "";
      pendingRequest.tempAgentToken = tempAgentToken;
      await pendingRequest.save();
    } else {
      pendingRequest = new RegistrationRequest({
        systemId: systemId,
        hostname: existingComputer.name,
        os: os || "Other",
        osVersion: osVersion || "",
        cpuModel: cpuModel || "",
        ram: ram || "",
        storage: storage || "",
        gpu: gpu || "",
        tempAgentToken: tempAgentToken
      });
      await pendingRequest.save();
    }

    // Inform agent that the request is queued and pending administrator confirmation
    res.status(202).json({
      status: "pending",
      requestId: pendingRequest._id,
      tempToken: tempAgentToken,
      systemName: existingComputer.name,
      message: "Registration request submitted. Pending administrator confirmation in the Admin Dashboard."
    });
  } catch (error) {
    console.error("Machine Registration Request Error:", error);
    res.status(500).json({ message: "Failed to queue registration request", error: error.message });
  }
});

// 1.1 Machine Registration Status Polling Endpoint
router.get("/register/status/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;
    const tempToken = req.headers["x-temp-token"];

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "Invalid request ID" });
    }

    const regRequest = await RegistrationRequest.findById(requestId);
    if (!regRequest) {
      return res.status(404).json({ message: "Registration request not found" });
    }

    // Verify temp agent token matches to authorize status check
    if (regRequest.tempAgentToken !== tempToken) {
      return res.status(403).json({ message: "Forbidden: Invalid temporary request token" });
    }

    if (regRequest.status === "pending") {
      return res.status(200).json({ status: "pending", message: "Awaiting administrator approval" });
    }

    if (regRequest.status === "rejected") {
      return res.status(200).json({ status: "rejected", message: "Registration request was declined by administrator" });
    }

    // If approved, finalize machine creation/token update and return formal agentToken
    let computer = null;
    if (regRequest.systemId) {
      computer = await Computer.findById(regRequest.systemId);
    } else {
      computer = await Computer.findOne({ name: new RegExp(`^${regRequest.hostname}$`, "i") });
    }

    const finalToken = crypto.randomBytes(32).toString("hex");

    if (computer) {
      const incomingOS = regRequest.os === "linux" ? "Linux" : (regRequest.os === "windows" ? "Windows" : "Other");
      const existingAgentOS = computer.agentSystemDetails?.operatingSystem;
      let isDual = computer.agentSystemDetails?.isDualBoot || false;

      if (existingAgentOS && existingAgentOS !== incomingOS) {
        isDual = true;
      }

      if (!computer.agentToken) {
        computer.agentToken = finalToken;
      }

      computer.agentSystemDetails = {
        operatingSystem: incomingOS,
        isDualBoot: isDual,
        osVersionLinux: incomingOS === "Linux" ? regRequest.osVersion : (computer.agentSystemDetails?.osVersionLinux || ""),
        osVersionWindows: incomingOS === "Windows" ? regRequest.osVersion : (computer.agentSystemDetails?.osVersionWindows || ""),
        cpuModel: regRequest.cpuModel || computer.agentSystemDetails?.cpuModel || "",
        ramTotal: regRequest.ram || computer.agentSystemDetails?.ramTotal || "",
        storageTotal: regRequest.storage || computer.agentSystemDetails?.storageTotal || "",
        gpuModel: regRequest.gpu || computer.agentSystemDetails?.gpuModel || "",
        lastAgentRegistration: new Date()
      };
      await computer.save();
    } else {
      const incomingOS = regRequest.os === "linux" ? "Linux" : (regRequest.os === "windows" ? "Windows" : "Other");
      computer = new Computer({
        name: regRequest.hostname,
        location: "Negces Lab",
        status: "available",
        agentToken: finalToken,
        agentSystemDetails: {
          operatingSystem: incomingOS,
          isDualBoot: false,
          osVersionLinux: incomingOS === "Linux" ? regRequest.osVersion : "",
          osVersionWindows: incomingOS === "Windows" ? regRequest.osVersion : "",
          cpuModel: regRequest.cpuModel || "",
          ramTotal: regRequest.ram || "",
          storageTotal: regRequest.storage || "",
          gpuModel: regRequest.gpu || "",
          lastAgentRegistration: new Date()
        }
      });
      await computer.save();
    }

    // Cleanup confirmed request
    await RegistrationRequest.findByIdAndDelete(requestId);

    res.status(200).json({
      status: "approved",
      machineId: computer._id,
      systemName: computer.name,
      authToken: computer.agentToken,
      message: `Registration confirmed for system ${computer.name}`
    });
  } catch (error) {
    console.error("Machine Registration Poll Status Error:", error);
    res.status(500).json({ message: "Failed to resolve registration status", error: error.message });
  }
});

// 2. Attendance Check-in / Check-out Endpoint
router.post("/attendance", verifyAgentToken, async (req, res) => {
  try {
    const { studentName, studentEmail, agenda, sessionType, action, osType, osHostname, hardwareUuid, macAddress } = req.body;
    const computer = req.computer;

    logger.info("Agent Attendance Event Received", {
      computerName: computer.name,
      computerId: computer._id.toString(),
      action,
      studentName,
      studentEmail,
      sessionType,
      osType,
      hardwareUuid
    });

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const currentTime = `${hours}:${minutes}`;

    const normalizedOsType = (osType || "unknown").toLowerCase();

    if (action === "checkin") {
      if (!studentName || !studentEmail) {
        return res.status(400).json({ message: "Student credentials are required for check-in" });
      }

      // Resolve today's approved bookings for this computer
      const bookings = await Booking.find({
        computerId: computer._id,
        status: "approved",
        startDate: { $lte: today },
        endDate: { $gte: today }
      });

      // Helper to check if currentTime falls within [startTime - 30m, endTime + 30m]
      const isWithinTimeWindow = (b) => {
        if (!b.startTime || !b.endTime) return true;
        const [curH, curM] = currentTime.split(":").map(Number);
        const curMins = curH * 60 + curM;

        const [startH, startM] = b.startTime.split(":").map(Number);
        const startMins = startH * 60 + startM - 30; // 30 min early check-in buffer

        const [endH, endM] = b.endTime.split(":").map(Number);
        const endMins = endH * 60 + endM + 30; // 30 min late buffer

        return curMins >= startMins && curMins <= endMins;
      };

      // Smart Priority Resolution:
      // Priority 1: Booking matching today + student email + time window (including 30-min early buffer)
      let activeBooking = bookings.find(b => 
        (b.userId === studentEmail || b.email === studentEmail) && isWithinTimeWindow(b)
      );

      // Priority 2: Booking matching student email on today's date
      if (!activeBooking) {
        activeBooking = bookings.find(b => 
          (b.userId === studentEmail || b.email === studentEmail)
        );
      }

      // Priority 3: Booking matching current time window on this computer
      if (!activeBooking) {
        activeBooking = bookings.find(b => isWithinTimeWindow(b));
      }

      // Priority 4: Fallback to any booking today for this computer
      if (!activeBooking && bookings.length > 0) {
        activeBooking = bookings[0];
      }

      // Classify Entry Type & Slot Conflict
      let entryType = 'WALK_IN';
      let isSlotConflict = false;
      if (activeBooking) {
        if (activeBooking.userId === studentEmail || activeBooking.email === studentEmail) {
          entryType = 'RESERVED_BOOKING';
        } else {
          entryType = 'WALK_IN';
          isSlotConflict = true; // User B walking into User A's reserved slot
        }
      }

      // 1. RE-ENTRY / RESUME CHECK (Accidental Checkout Fix)
      // Check if student recently checked out (within 15 minutes) on this computer
      const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000);
      const recentClosedSession = await AttendanceLog.findOne({
        computerId: computer._id,
        studentEmail,
        sessionStatus: 'COMPLETED',
        checkOutTime: { $gte: fifteenMinsAgo }
      }).sort({ checkOutTime: -1 });

      if (recentClosedSession) {
        // Resume session & append re-entry segment
        recentClosedSession.sessionStatus = 'ACTIVE';
        recentClosedSession.checkOutTime = null;
        recentClosedSession.lastHeartbeat = now;
        recentClosedSession.segments.push({
          checkIn: now,
          osType: normalizedOsType,
          reason: 'RE_CHECKIN'
        });
        await recentClosedSession.save();

        computer.agentActiveSession = {
          currentUser: studentName,
          email: studentEmail,
          agenda: agenda || recentClosedSession.agenda || "Working",
          sessionType: sessionType || recentClosedSession.sessionType || "Physical GUI",
          checkInTime: recentClosedSession.checkInTime,
          checkedIn: true,
          activeBookingId: activeBooking ? activeBooking._id : null,
          sessionId: recentClosedSession.sessionId
        };
        computer.status = "reserved";
        await computer.save();

        const { broadcastSystemStateChange } = require("../services/websocketService");
        broadcastSystemStateChange(computer._id, { status: computer.status, agentActiveSession: computer.agentActiveSession });

        return res.status(200).json({ 
          message: "Resumed previous session successfully (Re-entry window)", 
          session: computer.agentActiveSession 
        });
      }

      // 2. CROSS-OS SESSION HANDOVER CHECK (Windows ↔ Ubuntu Linux)
      const existingActiveLog = await AttendanceLog.findOne({
        computerId: computer._id,
        sessionStatus: 'ACTIVE'
      });

      if (existingActiveLog) {
        // Case A: Same student booting into another OS (e.g. Windows -> Linux reboot)
        if (existingActiveLog.studentEmail === studentEmail) {
          existingActiveLog.osType = normalizedOsType;
          existingActiveLog.lastHeartbeat = now;
          existingActiveLog.segments.push({
            checkIn: now,
            osType: normalizedOsType,
            reason: 'OS_SWITCH'
          });
          await existingActiveLog.save();

          computer.agentActiveSession = {
            currentUser: studentName,
            email: studentEmail,
            agenda: agenda || existingActiveLog.agenda || "Working",
            sessionType: sessionType || existingActiveLog.sessionType || "Physical GUI",
            checkInTime: existingActiveLog.checkInTime,
            checkedIn: true,
            activeBookingId: activeBooking ? activeBooking._id : null,
            sessionId: existingActiveLog.sessionId
          };
          computer.status = "reserved";
          await computer.save();

          const { broadcastSystemStateChange } = require("../services/websocketService");
          broadcastSystemStateChange(computer._id, { status: computer.status, agentActiveSession: computer.agentActiveSession });

          return res.status(200).json({ 
            message: `Active session handed over smoothly to ${normalizedOsType}`, 
            session: computer.agentActiveSession 
          });
        }

        // Case B: Machine was rebooted by a different user and previous heartbeat timed out (> 3 mins)
        const threeMinsAgo = new Date(now.getTime() - 3 * 60 * 1000);
        if (existingActiveLog.lastHeartbeat < threeMinsAgo) {
          // Auto-close stale orphan session
          existingActiveLog.sessionStatus = 'AUTO_CLOSED_REBOOT';
          existingActiveLog.checkOutTime = existingActiveLog.lastHeartbeat || now;
          existingActiveLog.durationMinutes = Math.round((existingActiveLog.checkOutTime - existingActiveLog.checkInTime) / 60000);
          await existingActiveLog.save();
        } else {
          // Machine is currently actively checked in by someone else
          return res.status(400).json({ 
            message: `This machine currently has an active session checked in by ${existingActiveLog.studentEmail}. Please check out first.` 
          });
        }
      }

      // 3. CREATE BRAND NEW STANDALONE ATTENDANCE LOG
      const sessionId = crypto.randomBytes(16).toString("hex");
      const newLog = new AttendanceLog({
        sessionId,
        computerId: computer._id,
        bookingId: activeBooking ? activeBooking._id : null,
        studentName,
        studentEmail,
        agenda: agenda || "Working",
        sessionType: sessionType || "Physical GUI",
        entryType,
        osType: normalizedOsType,
        osHostname: osHostname || "",
        hardwareUuid: hardwareUuid || "",
        macAddress: macAddress || "",
        checkInTime: now,
        lastHeartbeat: now,
        sessionStatus: 'ACTIVE',
        slotConflict: isSlotConflict,
        segments: [{ checkIn: now, osType: normalizedOsType, reason: 'INITIAL' }]
      });
      await newLog.save();

      computer.agentActiveSession = {
        currentUser: studentName,
        email: studentEmail,
        agenda: agenda || "Working",
        sessionType: sessionType || "Physical GUI",
        checkInTime: now,
        checkedIn: true,
        activeBookingId: activeBooking ? activeBooking._id : null,
        sessionId
      };
      computer.status = "reserved";

      // Also append to activeBooking.attendanceHistory for backward compatibility
      if (activeBooking) {
        if (!activeBooking.attendanceHistory) activeBooking.attendanceHistory = [];
        activeBooking.attendanceHistory.push({
          date: today,
          currentUser: studentName,
          email: studentEmail,
          agenda: agenda || "Working",
          sessionType: sessionType || "Physical GUI",
          checkInTime: now
        });
        await activeBooking.save();
      }

      await computer.save();

      const { broadcastSystemStateChange } = require("../services/websocketService");
      broadcastSystemStateChange(computer._id, { status: computer.status, agentActiveSession: computer.agentActiveSession });

      return res.status(200).json({ message: "Check-in successful", session: computer.agentActiveSession });

    } else if (action === "checkout") {
      if (!computer.agentActiveSession?.checkedIn && !computer.agentActiveSession?.sessionId) {
        return res.status(400).json({ message: "This machine does not have an active session to check out from." });
      }

      const activeSessionId = computer.agentActiveSession?.sessionId;

      // Close AttendanceLog session
      let log = null;
      if (activeSessionId) {
        log = await AttendanceLog.findOne({ sessionId: activeSessionId });
      }
      if (!log) {
        log = await AttendanceLog.findOne({ computerId: computer._id, sessionStatus: 'ACTIVE' }).sort({ checkInTime: -1 });
      }

      if (log) {
        log.sessionStatus = 'COMPLETED';
        log.checkOutTime = now;
        log.durationMinutes = Math.max(1, Math.round((now - log.checkInTime) / 60000));
        if (log.segments && log.segments.length > 0) {
          const lastSeg = log.segments[log.segments.length - 1];
          if (!lastSeg.checkOut) lastSeg.checkOut = now;
        }
        await log.save();
      }

      // Update Booking attendanceHistory checkOutTime (backward compatibility)
      if (computer.agentActiveSession?.activeBookingId) {
        const bk = await Booking.findById(computer.agentActiveSession.activeBookingId);
        if (bk && bk.attendanceHistory) {
          const entry = bk.attendanceHistory.find(h => h.date === today && h.email === computer.agentActiveSession.email);
          if (entry) {
            entry.checkOutTime = now;
            await bk.save();
          }
        }
      }

      computer.agentActiveSession = {
        currentUser: "",
        email: "",
        agenda: "",
        sessionType: "",
        checkInTime: null,
        checkedIn: false,
        activeBookingId: null,
        sessionId: null
      };
      computer.status = "available";
      await computer.save();

      const { broadcastSystemStateChange } = require("../services/websocketService");
      broadcastSystemStateChange(computer._id, { status: computer.status, agentActiveSession: computer.agentActiveSession });

      return res.status(200).json({ message: "Checkout successful", session: computer.agentActiveSession });

    } else {
      return res.status(400).json({ message: "Invalid action. Use checkin or checkout." });
    }
  } catch (error) {
    logger.error("Agent Attendance Error:", { error: error.message, stack: error.stack });
    res.status(500).json({ message: "Attendance processing failed", error: error.message });
  }
});

// 3. Batch/Fallback Metrics Submission
router.post("/metrics", verifyAgentToken, async (req, res) => {
  try {
    const { metrics } = req.body; // Expecting array of MetricRecords or a single MetricRecord
    const computer = req.computer;

    if (!metrics) {
      return res.status(400).json({ message: "Metrics data is required" });
    }

    const records = Array.isArray(metrics) ? metrics : [metrics];
    const metricDocs = [];

    for (const record of records) {
      const data = record.data || {};
      const timestamp = record.timestamp ? new Date(record.timestamp) : new Date();

      metricDocs.push({
        computerId: computer._id,
        timestamp,
        cpuUtil: data.cpu_util || 0,
        ramUtil: data.ram_util || 0,
        gpuUtil: data.gpu_util || 0,
        gpuMemUsed: data.gpu_mem_used || 0,
        gpuMemTotal: data.gpu_mem_total || 0,
        netSentSpeed: data.net_sent_speed || 0,
        netRecvSpeed: data.net_recv_speed || 0,
        diskUtil: data.disk_util || 0,
        cpuTemp: data.cpu_temp || 0,
        gpuTemp: data.gpu_temp || 0,
      });

      // Update live status with the most recent metric in the array
      if (timestamp >= (computer.lastSeen || 0)) {
        computer.liveMetrics = {
          cpuUtil: data.cpu_util || 0,
          ramUtil: data.ram_util || 0,
          gpuUtil: data.gpu_util || 0,
          gpuMemUsed: data.gpu_mem_used || 0,
          gpuMemTotal: data.gpu_mem_total || 0,
          netSentSpeed: data.net_sent_speed || 0,
          netRecvSpeed: data.net_recv_speed || 0,
          diskUtil: data.disk_util || 0,
          cpuTemp: data.cpu_temp || 0,
          gpuTemp: data.gpu_temp || 0,
        };
        computer.lastSeen = timestamp;
        computer.isOnline = true;
      }
    }

    if (metricDocs.length > 0) {
      await Metric.insertMany(metricDocs);
      // Write batch of queued offline metrics into InfluxDB v3
      writeMetricPointsBatch(computer._id, computer.name, metricDocs);
    }
    
    await computer.save();

    res.status(200).json({ message: `Successfully processed ${metricDocs.length} metric records` });
  } catch (error) {
    console.error("Agent Metrics Sync Error:", error);
    res.status(500).json({ message: "Metrics processing failed", error: error.message });
  }
});

// 4. Historical Metrics for Dashboard Graphs (Queries InfluxDB v3 with MongoDB fallback)
router.get("/:computerId/history", async (req, res) => {
  try {
    const { computerId } = req.params;
    const { startDate, endDate } = req.query;
    
    // 1. Try querying InfluxDB v3 time-series database first
    const influxData = await queryMetrics(computerId, startDate, endDate);
    if (influxData && influxData.length > 0) {
      return res.json(influxData);
    }

    // 2. Fallback to MongoDB if InfluxDB is unavailable or returns empty
    let queryFilter = { computerId };

    if (startDate && endDate) {
      const start = new Date(`${startDate}T00:00:00.000Z`);
      const end = new Date(`${endDate}T23:59:59.999Z`);
      queryFilter.timestamp = { $gte: start, $lte: end };
    } else {
      const hours = parseInt(req.query.hours) || 24; // Default to 24 hours of history
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
      queryFilter.timestamp = { $gte: cutoff };
    }

    const metrics = await Metric.find(queryFilter).sort({ timestamp: 1 });
    
    res.json(metrics);
  } catch (error) {
    console.error("Error fetching metrics history:", error);
    res.status(500).json({ message: "Failed to fetch metrics history" });
  }
});

// 5. Get current active booking for this computer (to auto-detect user details)
router.get("/current-booking", verifyAgentToken, async (req, res) => {
  try {
    const computer = req.computer;
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    
    // Robust 24-hour HH:MM time formatting independent of locale configurations
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const currentTime = `${hours}:${minutes}`;

    // Find approved bookings overlapping today for this computer
    const bookings = await Booking.find({
      computerId: computer._id,
      status: "approved",
      startDate: { $lte: today },
      endDate: { $gte: today }
    }).populate("user", "name email");

    // Find the one that spans current time
    const activeBooking = bookings.find(b => {
      if (b.startDate < today && b.endDate > today) {
        return true;
      }
      if (b.startDate === today && b.endDate === today) {
        return currentTime >= b.startTime && currentTime <= b.endTime;
      }
      if (b.startDate === today) {
        return currentTime >= b.startTime;
      }
      if (b.endDate === today) {
        return currentTime <= b.endTime;
      }
      return false;
    });

    // Only accept strictly active booking for the current time window
    if (!activeBooking) {
      return res.status(200).json({ bookingFound: false });
    }

    const selectedBooking = activeBooking;

    res.status(200).json({
      bookingFound: true,
      studentName: selectedBooking.user?.name || "Active Student",
      studentEmail: selectedBooking.user?.email || "",
      agenda: selectedBooking.reason || "",
      startTime: selectedBooking.startTime,
      endTime: selectedBooking.endTime,
    });
  } catch (error) {
    console.error("Error fetching current booking:", error);
    res.status(500).json({ message: "Failed to fetch current booking details" });
  }
});

module.exports = router;
