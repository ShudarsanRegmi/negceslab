const express = require('express');
const router = express.Router();
const Booking = require('../models/booking');
const Computer = require('../models/computer');
const User = require('../models/user');
const Notification = require('../models/notification');
const { verifyToken } = require('../middleware/auth');
const policy = require('../../shared/policy');
const { 
  sendBookingApprovedEmail, 
  sendBookingRejectedEmail, 
  sendBookingCancelledEmail 
} = require('../services/emailService');

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
        }
      ]
    });

    // Filter out adjacent bookings (end time == start time is allowed)
    const overlaps = conflictingBookings.filter(existing => {
      // If not same day, skip time check
      if (existing.endDate < startDate || existing.startDate > endDate) return false;
      // For each overlapping day, check time
      // If same day
      if (existing.startDate === startDate && existing.endDate === endDate) {
        // Only overlap if: newStart < existingEnd && newEnd > existingStart
        return (
          (startTime < existing.endTime && endTime > existing.startTime)
        );
      }
      // For multi-day, conservatively treat as overlap if date ranges overlap
      return true;
    });

    if (overlaps.length > 0) {
      return res.status(400).json({
        message: 'Time slot conflict with existing booking',
        conflicts: overlaps
      });
    }

    // Parse dates and times
    const startDateObj = new Date(startDate + 'T00:00:00');
    const endDateObj = new Date(endDate + 'T00:00:00');
    // Prevent booking in the past (date)
    const todayDateOnly = new Date();
    todayDateOnly.setHours(0, 0, 0, 0);
    if (startDateObj < todayDateOnly) {
      return res.status(400).json({ message: 'Cannot book for a past date.' });
    }
    // Prevent booking too far in the future
    const maxBookingDate = new Date(todayDateOnly);
    maxBookingDate.setDate(maxBookingDate.getDate() + policy.MAX_BOOKING_AHEAD_DAYS);
    if (startDateObj > maxBookingDate) {
      return res.status(400).json({ message: `Bookings can only be made up to ${policy.MAX_BOOKING_AHEAD_DAYS} days in advance.` });
    }
    // 1. End date must be after or equal to start date
    if (endDateObj < startDateObj) {
      return res.status(400).json({ message: 'End date must be after or equal to start date.' });
    }
    // 2. Booking duration cannot exceed policy.MAX_BOOKING_DAYS
    const durationInDays = Math.floor((endDateObj - startDateObj) / (1000 * 60 * 60 * 24)) + 1;
    if (durationInDays > policy.MAX_BOOKING_DAYS) {
      return res.status(400).json({ message: `Booking duration cannot exceed ${policy.MAX_BOOKING_DAYS} days.` });
    }
    // 4. Minimum booking duration is policy.MIN_BOOKING_HOURS for same-day bookings
    function parseTimeToMinutes(timeStr) {
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    }
    const minLabMinutes = policy.LAB_OPEN_HOUR * 60 + policy.LAB_OPEN_MINUTE;
    const maxLabMinutes = policy.LAB_CLOSE_HOUR * 60 + policy.LAB_CLOSE_MINUTE;
    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    if (startDate === endDate) {
      if (endMinutes - startMinutes < policy.MIN_BOOKING_HOURS * 60) {
        return res.status(400).json({ message: `Minimum booking duration is ${policy.MIN_BOOKING_HOURS} hour(s) for same-day bookings.` });
      }
    }
    // Prevent negative dataset size
    if (datasetSize && datasetSize.value < 0) {
      return res.status(400).json({ message: 'Dataset size cannot be negative.' });
    }
    // Check lab hours
    if (startMinutes < minLabMinutes) {
      return res.status(400).json({ message: `Start time must be at or after ${policy.LAB_OPEN_HOUR}:${policy.LAB_OPEN_MINUTE.toString().padStart(2, '0')}.` });
    }
    if (endMinutes > maxLabMinutes) {
      return res.status(400).json({ message: `End time must be at or before ${policy.LAB_CLOSE_HOUR}:${policy.LAB_CLOSE_MINUTE.toString().padStart(2, '0')}.` });
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
      message: `A new booking (ID: ${userBookingId}) has been made for computer ${computer.name} by user ${req.user.name}(${req.user.email}).`,
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
    if (error.name === 'ValidationError') {
      // Mongoose validation error (e.g., enum, min/max, required)
      const messages = Object.values(error.errors).map(e => e.message).join('; ');
      return res.status(400).json({ message: 'Validation error', error: messages });
    }
    if (error.name === 'MongoError' && error.code === 11000) {
      // Duplicate key error
      return res.status(400).json({ message: 'Duplicate booking', error: error.message });
    }
    // Malformed JSON or other client error
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
      return res.status(400).json({ message: 'Malformed JSON' });
    }
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

    // Send email notification
    try {
      console.log('Looking for user with firebaseUid:', booking.userId);
      const user = await User.findOne({ firebaseUid: booking.userId });
      console.log('Found user:', user ? { name: user.name, email: user.email } : 'Not found');
      
      if (user && user.email) {
        const userName = user.name || 'User';
        const computerName = booking.computerId.name;
        const startDate = new Date(booking.startDate).toLocaleDateString();
        const endDate = new Date(booking.endDate).toLocaleDateString();
        
        console.log('Sending email to:', user.email);
        
        if (status === 'approved') {
          await sendBookingApprovedEmail(
            user.email, 
            userName, 
            computerName, 
            startDate, 
            endDate, 
            booking.startTime, 
            booking.endTime
          );
        } else if (status === 'rejected') {
          await sendBookingRejectedEmail(
            user.email, 
            userName, 
            computerName, 
            startDate, 
            endDate, 
            booking.startTime, 
            booking.endTime, 
            rejectionReason
          );
        } else if (status === 'cancelled') {
          await sendBookingCancelledEmail(
            user.email, 
            userName, 
            computerName, 
            startDate, 
            endDate, 
            booking.startTime, 
            booking.endTime
          );
        }
      } else {
        console.log('User not found or no email for firebaseUid:', booking.userId);
      }
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
      // Don't fail the request if email fails
    }

    res.json(booking);
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ message: 'Error updating booking status', error: error.message });
  }
});

// Cancel booking (user can cancel their own pending bookings)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking or is admin
    const user = await User.findOne({ firebaseUid: req.user.firebaseUid });
    const isOwner = booking.userId === req.user.firebaseUid;
    const isAdmin = user && user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only cancel your own bookings' });
    }

    // Only allow cancellation of pending bookings (unless admin)
    if (booking.status !== 'pending' && !isAdmin) {
      return res.status(400).json({ message: 'Only pending bookings can be cancelled' });
    }

    // Update booking status to cancelled
    booking.status = 'cancelled';
    await booking.save();

    // Notify admins about the cancellation (if user cancelled)
    if (isOwner) {
      const userBookingId = booking._id.toString().slice(-6).toUpperCase();
      const admins = await User.find({ role: 'admin' });
      const adminNotifications = admins.map(admin => new Notification({
        userId: admin.firebaseUid,
        title: 'Booking Cancelled',
        message: `Booking (ID: ${userBookingId}) for computer ${booking.computerId} has been cancelled by user ${req.user.firebaseUid}.`,
        type: 'info',
        metadata: {
          bookingId: userBookingId,
          computerId: booking.computerId,
          userId: req.user.firebaseUid
        }
      }));
      if (adminNotifications.length > 0) {
        await Notification.insertMany(adminNotifications);
      }
    }

    // Send email notification for cancellation
    try {
      console.log('Looking for user with firebaseUid:', booking.userId);
      const user = await User.findOne({ firebaseUid: booking.userId });
      console.log('Found user for cancellation:', user ? { name: user.name, email: user.email } : 'Not found');
      
      if (user && user.email) {
        const userName = user.name || 'User';
        const computerName = booking.computerId.name || 'Computer';
        const startDate = new Date(booking.startDate).toLocaleDateString();
        const endDate = new Date(booking.endDate).toLocaleDateString();
        
        console.log('Sending cancellation email to:', user.email);
        
        await sendBookingCancelledEmail(
          user.email, 
          userName, 
          computerName, 
          startDate, 
          endDate, 
          booking.startTime, 
          booking.endTime
        );
      } else {
        console.log('User not found or no email for cancellation, firebaseUid:', booking.userId);
      }
    } catch (emailError) {
      console.error('Error sending cancellation email:', emailError);
      // Don't fail the request if email fails
    }

    // Populate computer and user details before sending response
    await booking.populate('computerId');
    await booking.populate('user', 'name email');
    
    res.json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Error cancelling booking', error: error.message });
  }
});

module.exports = router; 