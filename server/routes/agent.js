const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const Computer = require("../models/computer");
const Metric = require("../models/metric");
const Booking = require("../models/booking");
const { writeMetricPoint, writeMetricPointsBatch, queryMetrics } = require("../services/influxService");

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

// 1. Machine Registration Endpoint
router.post("/register", async (req, res) => {
  try {
    const { hostname, os, osVersion, cpuModel, ram, storage, gpu } = req.body;

    if (!hostname) {
      return res.status(400).json({ message: "Hostname is required for registration" });
    }

    // Check if machine already registered by name (case-insensitive)
    let computer = await Computer.findOne({ name: new RegExp(`^${hostname}$`, "i") });

    const generatedToken = crypto.randomBytes(32).toString("hex");

    if (computer) {
      // Update existing record with latest specs and assign/keep token
      computer.agentToken = generatedToken;
      computer.systemDetails = {
        operatingSystem: os === "linux" ? "Linux" : (os === "windows" ? "Windows" : "Other"),
        osVersion: osVersion || "",
        architecture: "x86_64",
        processor: cpuModel || "",
        ram: ram || "",
        storage: storage || "",
        gpu: gpu || "",
        installedSoftware: computer.systemDetails?.installedSoftware || [],
        lastUpdated: new Date()
      };
      await computer.save();
    } else {
      // Create a brand new Computer document
      computer = new Computer({
        name: hostname,
        location: "Negces Lab",
        status: "available",
        agentToken: generatedToken,
        systemDetails: {
          operatingSystem: os === "linux" ? "Linux" : (os === "windows" ? "Windows" : "Other"),
          osVersion: osVersion || "",
          architecture: "x86_64",
          processor: cpuModel || "",
          ram: ram || "",
          storage: storage || "",
          gpu: gpu || "",
          installedSoftware: [],
          lastUpdated: new Date()
        }
      });
      await computer.save();
    }

    res.status(200).json({
      machineId: computer._id,
      authToken: generatedToken,
      message: "Machine registered successfully"
    });
  } catch (error) {
    console.error("Machine Registration Error:", error);
    res.status(500).json({ message: "Failed to register machine", error: error.message });
  }
});

// 2. Attendance Check-in / Check-out Endpoint
router.post("/attendance", verifyAgentToken, async (req, res) => {
  try {
    const { studentName, studentEmail, agenda, sessionType, action } = req.body;
    const computer = req.computer;

    if (action === "checkin") {
      if (!studentName || !studentEmail) {
        return res.status(400).json({ message: "Student credentials are required for check-in" });
      }

      // Resolve today's booking to map to this attendance session
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const currentTime = `${hours}:${minutes}`;

      const bookings = await Booking.find({
        computerId: computer._id,
        status: "approved",
        startDate: { $lte: today },
        endDate: { $gte: today }
      });

      const activeBooking = bookings.find(b => {
        if (b.startDate < today && b.endDate > today) return true;
        if (b.startDate === today && b.endDate === today) return currentTime >= b.startTime && currentTime <= b.endTime;
        if (b.startDate === today) return currentTime >= b.startTime;
        if (b.endDate === today) return currentTime <= b.endTime;
        return false;
      }) || bookings[0];

      computer.agentActiveSession = {
        currentUser: studentName,
        email: studentEmail,
        agenda: agenda || "Working",
        sessionType: sessionType || "Physical GUI",
        checkInTime: new Date(),
        checkedIn: true,
        activeBookingId: activeBooking ? activeBooking._id : null
      };
      computer.status = "reserved";

      if (activeBooking) {
        // Record into booking's attendanceHistory
        const existingEntry = (activeBooking.attendanceHistory || []).find(h => h.date === today);
        if (existingEntry) {
          existingEntry.currentUser = studentName;
          existingEntry.email = studentEmail;
          existingEntry.agenda = agenda || "Working";
          existingEntry.sessionType = sessionType || "Physical GUI";
          existingEntry.checkInTime = new Date();
        } else {
          activeBooking.attendanceHistory.push({
            date: today,
            currentUser: studentName,
            email: studentEmail,
            agenda: agenda || "Working",
            sessionType: sessionType || "Physical GUI",
            checkInTime: new Date()
          });
        }
        await activeBooking.save();
      }
    } else if (action === "checkout") {
      if (computer.agentActiveSession?.activeBookingId) {
        const bk = await Booking.findById(computer.agentActiveSession.activeBookingId);
        if (bk && bk.attendanceHistory) {
          const entry = bk.attendanceHistory.find(h => h.date === today);
          if (entry) {
            entry.checkOutTime = new Date();
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
        activeBookingId: null
      };
      computer.status = "available";
    } else {
      return res.status(400).json({ message: "Invalid action. Use checkin or checkout." });
    }

    computer.lastSeen = new Date();
    computer.isOnline = true;
    await computer.save();

    res.status(200).json({
      message: `Successfully executed ${action}`,
      activeSession: computer.agentActiveSession
    });
  } catch (error) {
    console.error("Agent Attendance Error:", error);
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

    // Fallback: if no active booking matches current time, use first approved booking for today
    let selectedBooking = activeBooking;
    if (!selectedBooking && bookings.length > 0) {
      selectedBooking = bookings[0]; // simple fallback to first booking
    }

    if (!selectedBooking) {
      return res.status(200).json({ bookingFound: false });
    }

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
