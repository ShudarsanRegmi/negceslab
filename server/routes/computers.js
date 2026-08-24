const express = require("express");
const router = express.Router();
const Computer = require("../models/computer");
const Booking = require("../models/booking");
const User = require("../models/user");
const { verifyToken } = require("../middleware/auth");
const getLogger = require("../utils/logger");
const logger = getLogger("computers");

// Get all computers (public access)
router.get("/public", async (req, res) => {
  try {
    const computers = await Computer.find()
      .populate({
        path: 'bookings',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .sort({ name: 1 });
    res.json(computers);
  } catch (error) {
    console.error("Error fetching computers:", error);
    res.status(500).json({ message: "Error fetching computers" });
  }
});

// Get computers with their current and upcoming bookings (public access)
router.get("/public/with-bookings", async (req, res) => {
  try {
    // Get all computers with their bookings populated
    const computers = await Computer.find()
      .populate({
        path: 'bookings',
        populate: [
          { path: 'user', select: 'name email' },
          { path: 'attendanceActive' }
        ]
      })
      .sort({ name: 1 });

    // Get current date and time
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentTime = now.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });

    logger.debug("Current date and time for active bookings filtering", { today, currentTime });

    // Process each computer to include only relevant bookings
    const computersWithActiveBookings = computers.map(computer => {
      const computerObj = computer.toObject();
      
      // Filter bookings to include only current, upcoming, and pending ones
      computerObj.bookings = (computerObj.bookings || []).filter(booking => {
        // Include if:
        // 1. Booking is pending or approved
        // 2. Booking hasn't ended yet
        if (booking.status === 'rejected' || booking.status === 'cancelled') {
          return false;
        }

        // For today's bookings
        if (booking.startDate === today) {
          return booking.endTime > currentTime;
        }

        // For future bookings
        if (booking.startDate > today) {
          return true;
        }

        // For multi-day bookings
        if (booking.startDate <= today && booking.endDate >= today) {
          return true;
        }

        return false;
      });

      return computerObj;
    });

    res.json(computersWithActiveBookings);
  } catch (error) {
    console.error("Error fetching computers with bookings:", error);
    res.status(500).json({
      message: "Error fetching computers with bookings",
      error: error.message,
    });
  }
});

// Get all computers (authenticated)
router.get("/", verifyToken, async (req, res) => {
  try {
    const computers = await Computer.find()
      .populate({
        path: 'bookings',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .sort({ name: 1 });
    res.json(computers);
  } catch (error) {
    console.error("Error fetching computers:", error);
    res.status(500).json({ message: "Error fetching computers" });
  }
});

// Get computers with their current and upcoming bookings
router.get("/with-bookings", verifyToken, async (req, res) => {
  try {
    // Get all computers with their bookings populated
    const computers = await Computer.find()
      .populate({
        path: 'bookings',
        populate: [
          { path: 'user', select: 'name email' },
          { path: 'attendanceActive' }
        ]
      })
      .sort({ name: 1 });

    // Get current date and time
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentTime = now.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });

    logger.debug("Current date and time for active bookings filtering", { today, currentTime });

    // Process each computer to include only relevant bookings
    const computersWithActiveBookings = computers.map(computer => {
      const computerObj = computer.toObject();
      
      // Filter bookings to include only current, upcoming, and pending ones
      computerObj.bookings = (computerObj.bookings || []).filter(booking => {
        // Include if:
        // 1. Booking is pending or approved
        // 2. Booking hasn't ended yet
        if (booking.status === 'rejected' || booking.status === 'cancelled') {
          return false;
        }

        // For today's bookings
        if (booking.startDate === today) {
          return booking.endTime > currentTime;
        }

        // For future bookings
        if (booking.startDate > today) {
          return true;
        }

        // For multi-day bookings
        if (booking.startDate <= today && booking.endDate >= today) {
          return true;
        }

        return false;
      });

      return computerObj;
    });

    res.json(computersWithActiveBookings);
  } catch (error) {
    console.error("Error fetching computers with bookings:", error);
    res.status(500).json({
      message: "Error fetching computers with bookings",
      error: error.message,
    });
  }
});

// Create a new computer
router.post("/", verifyToken, async (req, res) => {
  try {
    const { name, location, specifications, status } = req.body;

    // Basic validation
    if (!name || !location) {
      return res
        .status(400)
        .json({ message: "Name and location are required" });
    }

    const computer = new Computer({
      name,
      location,
      status: status || "available", // Default to 'available' if not provided
      specifications: specifications || "",
    });

    await computer.save();
    res.status(201).json(computer);
  } catch (error) {
    console.error("Error creating computer:", error);
    if (error.code === 11000) {
      res
        .status(400)
        .json({ message: "A computer with this name already exists" });
    } else {
      res.status(500).json({
        message: "Error creating computer",
        error: error.message,
      });
    }
  }
});

// Update a computer
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { name, location, specifications, status } = req.body;
    const computerId = req.params.id;

    // Basic validation
    if (!name || !location) {
      return res
        .status(400)
        .json({ message: "Name and location are required" });
    }

    // Validate status if provided
    const validStatuses = ['available', 'maintenance', 'reserved'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be one of: available, maintenance, reserved"
      });
    }

    // Check if computer exists
    const existingComputer = await Computer.findById(computerId);
    if (!existingComputer) {
      return res.status(404).json({ message: "Computer not found" });
    }

    // Check if another computer with the same name exists (excluding current one)
    const duplicateComputer = await Computer.findOne({
      name: name,
      _id: { $ne: computerId }
    });
    
    if (duplicateComputer) {
      return res.status(400).json({
        message: "A computer with this name already exists"
      });
    }

    // If changing status to maintenance or reserved, check for active bookings
    if (status && (status === 'maintenance' || status === 'reserved') && existingComputer.status === 'available') {
      const activeBookings = await Booking.findOne({
        computerId: computerId,
        status: { $in: ['approved', 'pending'] },
        endDate: { $gte: new Date().toISOString().split("T")[0] },
      });

      if (activeBookings) {
        return res.status(400).json({
          message: `Cannot change status to ${status} while computer has active bookings. Please handle existing bookings first.`,
        });
      }
    }

    // Update the computer
    const updatedComputer = await Computer.findByIdAndUpdate(
      computerId,
      {
        name,
        location,
        specifications: specifications || existingComputer.specifications,
        status: status || existingComputer.status,
      },
      { 
        new: true, // Return updated document
        runValidators: true // Run schema validations
      }
    );

    res.json({
      message: "Computer updated successfully",
      computer: updatedComputer
    });

  } catch (error) {
    console.error("Error updating computer:", error);
    if (error.code === 11000) {
      res.status(400).json({ 
        message: "A computer with this name already exists" 
      });
    } else {
      res.status(500).json({
        message: "Error updating computer",
        error: error.message,
      });
    }
  }
});

// Delete a computer
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    // Check if computer has any active bookings
    const activeBookings = await Booking.findOne({
      computerId: req.params.id,
      status: { $in: ['approved', 'pending'] },
      endDate: { $gte: new Date().toISOString().split("T")[0] },
    });

    if (activeBookings) {
      return res.status(400).json({
        message: "Cannot delete computer with active bookings",
      });
    }

    const computer = await Computer.findByIdAndDelete(req.params.id);
    if (!computer) {
      return res.status(404).json({ message: "Computer not found" });
    }

    res.json({ message: "Computer deleted successfully" });
  } catch (error) {
    console.error("Error deleting computer:", error);
    res.status(500).json({
      message: "Error deleting computer",
      error: error.message,
    });
  }
});

// ==========================================
// AGENT REGISTRATION MANAGEMENT ENDPOINTS (Admin Only)
// ==========================================
const RegistrationToken = require("../models/registrationToken");
const RegistrationRequest = require("../models/registrationRequest");
const crypto = require("crypto");
const { isAdmin } = require("../middleware/auth");

// 1. Get current active token or generate one if none exists (Auto-expires in 30 mins)
router.get("/admin/registration-token", verifyToken, isAdmin, async (req, res) => {
  try {
    let tokenDoc = await RegistrationToken.findOne({ expiresAt: { $gt: new Date() } });
    if (!tokenDoc) {
      const token = crypto.randomBytes(16).toString("hex").toUpperCase();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes life window
      tokenDoc = new RegistrationToken({ token, expiresAt });
      await tokenDoc.save();
    }
    res.json({
      token: tokenDoc.token,
      expiresAt: tokenDoc.expiresAt,
      minutesRemaining: Math.max(0, Math.round((tokenDoc.expiresAt.getTime() - Date.now()) / 60000))
    });
  } catch (error) {
    console.error("Error fetching/generating registration token:", error);
    res.status(500).json({ message: "Error management of registration token" });
  }
});

// 2. Force rotate/refresh the registration token
router.post("/admin/registration-token/rotate", verifyToken, isAdmin, async (req, res) => {
  try {
    await RegistrationToken.deleteMany({});
    const token = crypto.randomBytes(16).toString("hex").toUpperCase();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const tokenDoc = new RegistrationToken({ token, expiresAt });
    await tokenDoc.save();

    res.json({
      token: tokenDoc.token,
      expiresAt: tokenDoc.expiresAt,
      minutesRemaining: 30
    });
  } catch (error) {
    console.error("Error rotating registration token:", error);
    res.status(500).json({ message: "Error rotating registration token" });
  }
});

// 3. List all pending agent registration confirmation requests
router.get("/admin/registration-requests", verifyToken, isAdmin, async (req, res) => {
  try {
    const requests = await RegistrationRequest.find({ status: "pending" })
      .populate("systemId", "name location")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error("Error fetching registration requests:", error);
    res.status(500).json({ message: "Error fetching registration requests" });
  }
});

// 4. Admin confirmation action: Approve or Reject a request
router.post("/admin/registration-requests/:requestId/action", verifyToken, isAdmin, async (req, res) => {
  try {
    const { action } = req.body; // "approve" or "reject"
    const { requestId } = req.params;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Action must be approve or reject" });
    }

    const regRequest = await RegistrationRequest.findById(requestId);
    if (!regRequest) {
      return res.status(404).json({ message: "Registration request not found" });
    }

    if (action === "approve") {
      regRequest.status = "approved";
      await regRequest.save();
      res.json({ message: "Request approved. Agent will complete registration upon next poll." });
    } else {
      regRequest.status = "rejected";
      await regRequest.save();
      res.json({ message: "Request declined successfully" });
    }
  } catch (error) {
    console.error("Error handling registration request action:", error);
    res.status(500).json({ message: "Error handling registration request" });
  }
});

module.exports = router;
