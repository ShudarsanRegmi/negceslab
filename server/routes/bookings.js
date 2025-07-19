const express = require('express');
const router = express.Router();
const Booking = require('../models/booking');
const Computer = require('../models/computer');
const User = require('../models/user');
const Notification = require('../models/notification');
const { verifyToken } = require('../middleware/auth');

// Create a new booking
router.post('/', verifyToken, async (req, res) => {
  try {
    console.log('Creating booking with data:', req.body);
    console.log('User:', req.user);
    
    const { computerId, date, startTime, endTime, reason } = req.body;
    
    // Validate required fields
    if (!computerId || !date || !startTime || !endTime || !reason) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['computerId', 'date', 'startTime', 'endTime', 'reason'],
        received: { computerId, date, startTime, endTime, reason }
      });
    }
    
    // Check if computer exists and is available
    const computer = await Computer.findById(computerId);
    if (!computer) {
      return res.status(404).json({ message: 'Computer not found' });
    }
    
    if (computer.status !== 'available') {
      return res.status(400).json({ message: 'Computer is not available for booking' });
    }
    
    // Check for conflicting bookings
    const conflictingBooking = await Booking.findOne({
      computerId,
      date,
      status: { $in: ['pending', 'approved'] },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });
    
    if (conflictingBooking) {
      return res.status(400).json({ message: 'Time slot is already booked' });
    }
    
    // Create booking
    const booking = new Booking({
      userId: req.user.firebaseUid,
      computerId,
      date,
      startTime,
      endTime,
      reason,
      status: 'pending'
    });
    
    console.log('Saving booking:', booking);
    await booking.save();
    console.log('Booking saved successfully');
    
    // Create notification for admin about new booking
    const adminNotification = new Notification({
      userId: 'admin', // Special identifier for admin notifications
      title: 'New Booking Request',
      message: `User ${req.user.email} has requested to book ${computer.name} on ${date} from ${startTime} to ${endTime}`,
      type: 'info',
      isRead: false,
      metadata: {
        bookingId: booking._id,
        computerId: computer._id,
        computerName: computer.name,
        userId: req.user.firebaseUid,
        userEmail: req.user.email
      }
    });
    
    await adminNotification.save();
    
    // Create notification for user
    const userNotification = new Notification({
      userId: req.user.firebaseUid,
      title: 'Booking Request Submitted',
      message: `Your booking request for ${computer.name} on ${date} has been submitted and is pending approval.`,
      type: 'info',
      isRead: false,
      metadata: {
        bookingId: booking._id,
        computerId: computer._id,
        computerName: computer.name
      }
    });
    
    await userNotification.save();
    
    res.status(201).json(booking);
  } catch (error) {
    console.error('Create Booking Error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ message: 'Error creating booking', error: error.message });
  }
});

// Get all bookings (admin) or user's bookings
router.get('/', verifyToken, async (req, res) => {
  try {
    let bookings;
    if (req.user.role === 'admin') {
      bookings = await Booking.find()
        .populate('computerId', 'name location')
        .sort({ createdAt: -1 });
      
      // Populate user information for admin view
      const bookingsWithUserInfo = await Promise.all(
        bookings.map(async (booking) => {
          const user = await User.findOne({ firebaseUid: booking.userId });
          return {
            ...booking.toObject(),
            userInfo: user ? {
              name: user.name,
              email: user.email
            } : {
              name: 'Unknown User',
              email: booking.userId
            }
          };
        })
      );
      
      res.json(bookingsWithUserInfo);
    } else {
      bookings = await Booking.find({ userId: req.user.firebaseUid })
        .populate('computerId', 'name location')
        .sort({ createdAt: -1 });
      res.json(bookings);
    }
  } catch (error) {
    console.error('Get Bookings Error:', error);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

// Update booking status (admin only)
router.put('/:id/status', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id).populate('computerId', 'name');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const oldStatus = booking.status;
    booking.status = status;
    await booking.save();
    
    // Update computer status based on booking status
    const computer = await Computer.findById(booking.computerId._id);
    if (computer) {
      if (status === 'approved') {
        computer.status = 'booked';
      } else if (oldStatus === 'approved' && (status === 'rejected' || status === 'cancelled')) {
        // Check if there are any other approved bookings for this computer
        const otherApprovedBookings = await Booking.findOne({
          computerId: booking.computerId._id,
          status: 'approved',
          _id: { $ne: booking._id }
        });
        
        if (!otherApprovedBookings) {
          computer.status = 'available';
        }
      }
      await computer.save();
    }
    
    // Create notification for user about status change
    const notificationTitle = status === 'approved' ? 'Booking Approved' : 'Booking Rejected';
    const notificationMessage = status === 'approved' 
      ? `Your booking for ${booking.computerId.name} on ${booking.date} has been approved!`
      : `Your booking for ${booking.computerId.name} on ${booking.date} has been rejected.`;
    
    const userNotification = new Notification({
      userId: booking.userId,
      title: notificationTitle,
      message: notificationMessage,
      type: status === 'approved' ? 'success' : 'error',
      isRead: false,
      metadata: {
        bookingId: booking._id,
        computerId: booking.computerId._id,
        computerName: booking.computerId.name
      }
    });
    
    await userNotification.save();
    
    res.json(booking);
  } catch (error) {
    console.error('Update Booking Status Error:', error);
    res.status(500).json({ message: 'Error updating booking status' });
  }
});

// Cancel booking
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('computerId', 'name');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if user owns the booking or is admin
    if (booking.userId !== req.user.firebaseUid && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }
    
    const wasApproved = booking.status === 'approved';
    await Booking.findByIdAndDelete(req.params.id);
    
    // Update computer status if the cancelled booking was approved
    if (wasApproved) {
      const computer = await Computer.findById(booking.computerId._id);
      if (computer) {
        // Check if there are any other approved bookings for this computer
        const otherApprovedBookings = await Booking.findOne({
          computerId: booking.computerId._id,
          status: 'approved'
        });
        
        if (!otherApprovedBookings) {
          computer.status = 'available';
          await computer.save();
        }
      }
    }
    
    // Create notification for admin if user cancelled
    if (booking.userId === req.user.firebaseUid && req.user.role !== 'admin') {
      const adminNotification = new Notification({
        userId: 'admin',
        title: 'Booking Cancelled',
        message: `User ${req.user.email} has cancelled their booking for ${booking.computerId.name} on ${booking.date}`,
        type: 'warning',
        isRead: false,
        metadata: {
          bookingId: booking._id,
          computerId: booking.computerId._id,
          computerName: booking.computerId.name,
          userId: req.user.firebaseUid,
          userEmail: req.user.email
        }
      });
      
      await adminNotification.save();
    }
    
    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Cancel Booking Error:', error);
    res.status(500).json({ message: 'Error cancelling booking' });
  }
});

module.exports = router; 