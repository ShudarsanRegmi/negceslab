const express = require("express");
const router = express.Router();
const Computer = require("../models/computer");
const Notification = require("../models/notification");
const { verifyToken } = require("../middleware/auth");

// Get all computers
router.get("/", verifyToken, async (req, res) => {
  try {
    const computers = await Computer.find().sort({ createdAt: -1 });
    res.json(computers);
  } catch (error) {
    console.error("Get Computers Error:", error);
    res.status(500).json({ message: "Error fetching computers" });
  }
});

// Get all computers with booking information
router.get("/with-bookings", verifyToken, async (req, res) => {
  try {
    const computers = await Computer.find().sort({ createdAt: -1 });
    const Booking = require("../models/booking");

    // Get current date and time
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().split(" ")[0];

    // Get all approved bookings
    const approvedBookings = await Booking.find({
      status: "approved",
      $or: [
        { date: { $gt: today } },
        {
          date: today,
          endTime: { $gt: currentTime },
        },
      ],
    }).populate("computerId", "name location");

    // Create a map of computer bookings
    const computerBookings = {};
    approvedBookings.forEach((booking) => {
      // Skip bookings with null computerId (orphaned bookings)
      if (!booking.computerId || !booking.computerId._id) {
        return;
      }
      if (!computerBookings[booking.computerId._id]) {
        computerBookings[booking.computerId._id] = [];
      }
      computerBookings[booking.computerId._id].push(booking);
    });

    // Add booking information to computers and update their status
    const computersWithBookings = await Promise.all(
      computers.map(async (computer) => {
        const bookings = computerBookings[computer._id] || [];
        const hasActiveBookings = bookings.length > 0;

        // Update computer status based on bookings
        let updatedStatus = computer.status;
        if (hasActiveBookings && computer.status !== "maintenance") {
          updatedStatus = "booked";
          // Update the computer status in database if it's not already 'booked'
          if (computer.status !== "booked") {
            await Computer.findByIdAndUpdate(computer._id, {
              status: "booked",
            });
          }
        } else if (
          !hasActiveBookings &&
          computer.status === "booked" &&
          computer.status !== "maintenance"
        ) {
          updatedStatus = "available";
          // Update the computer status in database if it should be available
          await Computer.findByIdAndUpdate(computer._id, {
            status: "available",
          });
        }

        return {
          ...computer.toObject(),
          status: updatedStatus,
          currentBookings: bookings,
          nextAvailable:
            bookings.length > 0 ? bookings[bookings.length - 1].endTime : null,
          nextAvailableDate:
            bookings.length > 0 ? bookings[bookings.length - 1].date : null,
        };
      })
    );

    res.json(computersWithBookings);
  } catch (error) {
    console.error("Get Computers with Bookings Error:", error);
    res
      .status(500)
      .json({ message: "Error fetching computers with booking information" });
  }
});

// Add new computer (admin only)
router.post("/", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { name, location, specifications, status } = req.body;
    const computer = new Computer({
      name,
      location,
      specifications,
      status: status || "available",
    });

    await computer.save();
    res.status(201).json(computer);
  } catch (error) {
    console.error("Create Computer Error:", error);
    res.status(500).json({ message: "Error creating computer" });
  }
});

// Update computer (admin only)
router.put("/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { name, location, specifications, status } = req.body;

    // Get the current computer to check if status is changing
    const currentComputer = await Computer.findById(req.params.id);
    if (!currentComputer) {
      return res.status(404).json({ message: "Computer not found" });
    }

    const computer = await Computer.findByIdAndUpdate(
      req.params.id,
      { name, location, specifications, status },
      { new: true }
    );

    // Send notification if computer status changed to maintenance
    if (currentComputer.status !== "maintenance" && status === "maintenance") {
      const maintenanceNotification = new Notification({
        userId: "all", // Special identifier for all users
        title: "Computer Maintenance Alert",
        message: `${computer.name} (${computer.location}) is now under maintenance and unavailable for booking.`,
        type: "warning",
        isRead: false,
        metadata: {
          computerId: computer._id,
          computerName: computer.name,
          computerLocation: computer.location,
          previousStatus: currentComputer.status,
          newStatus: status,
        },
      });

      await maintenanceNotification.save();
    }

    // Send notification if computer status changed from maintenance to available
    if (currentComputer.status === "maintenance" && status === "available") {
      const availableNotification = new Notification({
        userId: "all", // Special identifier for all users
        title: "Computer Available",
        message: `${computer.name} (${computer.location}) is now available for booking after maintenance.`,
        type: "success",
        isRead: false,
        metadata: {
          computerId: computer._id,
          computerName: computer.name,
          computerLocation: computer.location,
          previousStatus: currentComputer.status,
          newStatus: status,
        },
      });

      await availableNotification.save();
    }

    res.json(computer);
  } catch (error) {
    console.error("Update Computer Error:", error);
    res.status(500).json({ message: "Error updating computer" });
  }
});

// Delete computer (admin only)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const computer = await Computer.findByIdAndDelete(req.params.id);
    if (!computer) {
      return res.status(404).json({ message: "Computer not found" });
    }

    res.json({ message: "Computer deleted successfully" });
  } catch (error) {
    console.error("Delete Computer Error:", error);
    res.status(500).json({ message: "Error deleting computer" });
  }
});

module.exports = router;
