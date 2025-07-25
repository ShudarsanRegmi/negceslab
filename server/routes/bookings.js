const express = require('express');
const router = express.Router();
const Booking = require('../models/booking');
const Computer = require('../models/computer');
const User = require('../models/user');
const Notification = require('../models/notification');
const { verifyToken } = require('../middleware/auth');

// Get all bookings (admin) or user's bookings
router.get('/', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findOne({ firebaseUid: req.user.firebaseUid });
    const isAdmin = user && user.role === 'admin';

    let bookings;
    if (isAdmin) {
      // Admin gets all bookings
      bookings = await Booking.find()
        .populate('computerId')
        .populate('user', 'name email')
        .sort({ createdAt: -1 });
      res.json(bookings);
    } else {
      // Regular users only get their own bookings
      bookings = await Booking.find({ userId: req.user.firebaseUid })
        .populate('computerId')
        .populate('user', 'name email')
        .sort({ createdAt: -1 });
      res.json(bookings);
    }
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
});

// Get current bookings (admin only)
router.get('/current', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findOne({ firebaseUid: req.user.firebaseUid });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Get current date and time
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit'
    });

    console.log('Fetching current bookings for:', { currentDate, currentTime });

    // Get all approved bookings that haven't expired yet
    const currentBookings = await Booking.find({
      status: { $in: ['approved', 'pending'] },
      $or: [
        // Single day bookings that haven't ended yet
        {
          startDate: currentDate,
          endDate: currentDate,
          endTime: { $gte: currentTime }
        },
        // Future bookings
        {
          startDate: { $gt: currentDate }
        },
        // Multi-day bookings that haven't ended yet
        {
          endDate: { $gte: currentDate }
        }
      ]
    })
    .populate('computerId')
    .populate('user', 'name email')
    .sort({ startDate: 1, startTime: 1 });

    console.log('Found current bookings:', currentBookings.length);
    res.json(currentBookings);
  } catch (error) {
    console.error('Error fetching current bookings:', error);
    res.status(500).json({ message: 'Error fetching current bookings', error: error.message });
  }
});

// Create a new booking
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      computerId,
      startDate,
      endDate,
      startTime,
      endTime,
      reason,
      requiresGPU,
      gpuMemoryRequired,
      problemStatement,
      datasetType,
      datasetSize,
      datasetLink,
      bottleneckExplanation
    } = req.body;

    // Basic validation
    if (!computerId || !startDate || !endDate || !startTime || !endTime || !reason) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if computer exists
    const computer = await Computer.findById(computerId);
    if (!computer) {
      return res.status(404).json({ message: 'Computer not found' });
    }

    // Check for booking conflicts
    const conflictingBookings = await Booking.find({
      computerId,
      status: { $in: ['approved', 'pending'] },
      $or: [
        // Check if new booking overlaps with existing bookings
        {
          startDate: { $lte: endDate },
          endDate: { $gte: startDate },
          $or: [
            // Same day booking overlap
            {
              startDate: startDate,
              endDate: endDate,
              $or: [
                { startTime: { $lte: endTime }, endTime: { $gt: startTime } },
                { startTime: { $lt: endTime }, endTime: { $gte: startTime } }
              ]
            },
            // Multi-day booking overlap
            {
              $or: [
                { startDate: { $lt: endDate }, endDate: { $gt: startDate } }
              ]
            }
          ]
        }
      ]
    });

    if (conflictingBookings.length > 0) {
      return res.status(400).json({
        message: 'Time slot conflict with existing booking',
        conflicts: conflictingBookings
      });
    }

    // Lab hours/time validation
    // Parse times as minutes since midnight
    function parseTimeToMinutes(timeStr) {
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    }
    const minLabMinutes = 8 * 60 + 30; // 8:30
    const maxLabMinutes = 17 * 60 + 30; // 17:30
    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    // Check lab hours
    if (startMinutes < minLabMinutes) {
      return res.status(400).json({ message: 'Start time must be at or after 8:30 AM.' });
    }
    if (endMinutes > maxLabMinutes) {
      return res.status(400).json({ message: 'End time must be at or before 5:30 PM.' });
    }
    if (endMinutes <= startMinutes) {
      return res.status(400).json({ message: 'End time must be after start time.' });
    }
    // Prevent booking in the past (for today)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    if (startDate === todayStr) {
      const nowMinutes = today.getHours() * 60 + today.getMinutes();
      if (startMinutes < nowMinutes) {
        return res.status(400).json({ message: 'Start time must not be in the past.' });
      }
    }

    // Create booking
    const booking = new Booking({
      userId: req.user.firebaseUid,
      computerId,
      startDate,
      endDate,
      startTime,
      endTime,
      reason,
      requiresGPU,
      gpuMemoryRequired,
      problemStatement,
      datasetType,
      datasetSize,
      datasetLink,
      bottleneckExplanation
    });

    await booking.save();

    // Notify all admins about the new booking
    const userBookingId = booking._id.toString().slice(-6).toUpperCase();
    const admins = await User.find({ role: 'admin' });
    const adminNotifications = admins.map(admin => new Notification({
      userId: admin.firebaseUid,
      title: 'New Booking Request',
      message: `A new booking (ID: ${userBookingId}) has been made for computer ${computer.name} by user ${req.user.firebaseUid}.`,
      type: 'info',
      metadata: {
        bookingId: userBookingId,
        computerId: computer._id,
        computerName: computer.name,
        userId: req.user.firebaseUid
      }
    }));
    if (adminNotifications.length > 0) {
      await Notification.insertMany(adminNotifications);
    }

    // Populate computer and user details before sending response
    await booking.populate('computerId');
    await booking.populate('user', 'name email');
    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Error creating booking', error: error.message });
  }
});

// Update booking status (admin only)
router.put('/:id/status', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.firebaseUid });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { status, rejectionReason } = req.body;
    if (!['approved', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // If status is rejected, require rejection reason
    if (status === 'rejected' && !rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('computerId')
      .populate('user', 'name email');
      
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = status;
    if (status === 'rejected') {
      booking.rejectionReason = rejectionReason;
    }
    await booking.save();

    // Notify user about status change
    let notifTitle = '';
    let notifMsg = '';
    const userBookingId = booking._id.toString().slice(-6).toUpperCase();
    if (status === 'approved') {
      notifTitle = 'Booking Approved';
      notifMsg = `Your booking (ID: ${userBookingId}) for computer ${booking.computerId.name} has been approved.`;
    } else if (status === 'rejected') {
      notifTitle = 'Booking Rejected';
      notifMsg = `Your booking (ID: ${userBookingId}) for computer ${booking.computerId.name} has been rejected. Reason: ${rejectionReason}`;
    } else if (status === 'cancelled') {
      notifTitle = 'Booking Cancelled';
      notifMsg = `Your booking (ID: ${userBookingId}) for computer ${booking.computerId.name} has been cancelled.`;
    }
    if (notifTitle && notifMsg) {
      const userNotification = new Notification({
        userId: booking.userId,
        title: notifTitle,
        message: notifMsg,
        type: status === 'approved' ? 'success' : 'error',
        metadata: {
          bookingId: userBookingId,
          computerId: booking.computerId._id,
          computerName: booking.computerId.name
        }
      });
      await userNotification.save();
    }

    res.json(booking);
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ message: 'Error updating booking status', error: error.message });
  }
});

module.exports = router; 