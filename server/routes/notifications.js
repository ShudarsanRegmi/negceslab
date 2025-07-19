const express = require("express");
const router = express.Router();
const Notification = require("../models/notification");
const { verifyToken } = require("../middleware/auth");

// Get user's notifications (including admin notifications for admin users)
router.get("/", verifyToken, async (req, res) => {
  try {
    let notifications;
    if (req.user.role === "admin") {
      // Admin gets both their personal notifications and admin notifications
      notifications = await Notification.find({
        $or: [{ userId: req.user.firebaseUid }, { userId: "admin" }],
      })
        .sort({ createdAt: -1 })
        .limit(50);
    } else {
      // Regular users get their personal notifications and broadcast notifications ('all')
      notifications = await Notification.find({
        $or: [{ userId: req.user.firebaseUid }, { userId: "all" }],
      })
        .sort({ createdAt: -1 })
        .limit(50);
    }
    res.json(notifications);
  } catch (error) {
    console.error("Get Notifications Error:", error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
});

// Mark notification as read
router.put("/:id/read", verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [
          { userId: req.user.firebaseUid },
          { userId: "admin" }, // Admin can mark admin notifications as read
          { userId: "all" }, // Users can mark broadcast notifications as read
        ],
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    console.error("Mark Notification Read Error:", error);
    res.status(500).json({ message: "Error updating notification" });
  }
});

// Mark all notifications as read
router.put("/read-all", verifyToken, async (req, res) => {
  try {
    if (req.user.role === "admin") {
      await Notification.updateMany(
        {
          $or: [{ userId: req.user.firebaseUid }, { userId: "admin" }],
          isRead: false,
        },
        { isRead: true }
      );
    } else {
      await Notification.updateMany(
        {
          $or: [{ userId: req.user.firebaseUid }, { userId: "all" }],
          isRead: false,
        },
        { isRead: true }
      );
    }
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark All Notifications Read Error:", error);
    res.status(500).json({ message: "Error updating notifications" });
  }
});

// Create notification (admin only) - for sending notifications to users
router.post("/", verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { userId, title, message, type, targetUsers } = req.body;

    // If targetUsers is provided, send to multiple users
    if (targetUsers && Array.isArray(targetUsers)) {
      const notifications = [];
      for (const targetUserId of targetUsers) {
        const notification = new Notification({
          userId: targetUserId,
          title,
          message,
          type: type || "info",
          metadata: {
            sentBy: req.user.firebaseUid,
            sentByEmail: req.user.email,
          },
        });
        notifications.push(notification);
      }
      await Notification.insertMany(notifications);
      res.status(201).json({
        message: `Notifications sent to ${notifications.length} users`,
      });
    } else if (userId) {
      // Send to single user
      const notification = new Notification({
        userId,
        title,
        message,
        type: type || "info",
        metadata: {
          sentBy: req.user.firebaseUid,
          sentByEmail: req.user.email,
        },
      });

      await notification.save();
      res.status(201).json(notification);
    } else {
      res
        .status(400)
        .json({ message: "Either userId or targetUsers array is required" });
    }
  } catch (error) {
    console.error("Create Notification Error:", error);
    res.status(500).json({ message: "Error creating notification" });
  }
});

// Get all users for admin to send notifications (admin only)
router.get("/users", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Get unique user IDs from notifications
    const users = await Notification.distinct("userId", {
      userId: { $ne: "admin" },
    });
    res.json(users);
  } catch (error) {
    console.error("Get Users Error:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

module.exports = router;
