const express = require('express');
const router = express.Router();
const Booking = require('../models/booking');
const Computer = require('../models/computer');
const User = require('../models/user');
const { verifyToken } = require('../middleware/auth');

// Create a new booking
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      computerId,
      date,
      startTime,
      endTime,
      reason
    } = req.body;

    // Basic validation
    if (!computerId || !date || !startTime || !endTime || !reason) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if computer exists
    const computer = await Computer.findById(computerId);
    if (!computer) {
      return res.status(404).json({ message: 'Computer not found' });
    }

    // Create booking
    const booking = new Booking({
      userId: req.user.firebaseUid,
      computerId,
      date,
      startTime,
      endTime,
      reason
    });

    await booking.save();
    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Error creating booking', error: error.message });
  }
});

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
        .sort({ createdAt: -1 });

      // Add user info to each booking
      const bookingsWithUserInfo = await Promise.all(
        bookings.map(async (booking) => {
          const user = await User.findOne({ firebaseUid: booking.userId });
          const bookingObj = booking.toObject();
          return {
            ...bookingObj,
            userInfo: user ? {
              name: user.name,
              email: user.email
            } : null
          };
        })
      );

      res.json(bookingsWithUserInfo);
    } else {
      // Regular users only get their own bookings
      bookings = await Booking.find({ userId: req.user.firebaseUid })
        .populate('computerId')
        .sort({ createdAt: -1 });
      res.json(bookings);
    }
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
});

// Get a specific booking
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.firebaseUid });
    const isAdmin = user && user.role === 'admin';

    const query = isAdmin ? { _id: req.params.id } : { _id: req.params.id, userId: req.user.firebaseUid };
    const booking = await Booking.findOne(query).populate('computerId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (isAdmin) {
      const user = await User.findOne({ firebaseUid: booking.userId });
      const bookingObj = booking.toObject();
      bookingObj.userInfo = user ? {
        name: user.name,
        email: user.email
      } : null;
      res.json(bookingObj);
    } else {
      res.json(booking);
    }
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Error fetching booking', error: error.message });
  }
});

// Update booking status (admin only)
router.put('/:id/status', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.firebaseUid });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { status } = req.body;
    if (!['approved', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await Booking.findById(req.params.id).populate('computerId');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = status;
    await booking.save();

    // Update computer status if needed
    if (status === 'approved') {
      await Computer.findByIdAndUpdate(booking.computerId._id, { status: 'booked' });
    } else if (status === 'rejected' || status === 'cancelled') {
      // Check if there are other approved bookings for this computer
      const otherApprovedBookings = await Booking.findOne({
        computerId: booking.computerId._id,
        status: 'approved',
        _id: { $ne: booking._id }
      });

      if (!otherApprovedBookings) {
        await Computer.findByIdAndUpdate(booking.computerId._id, { status: 'available' });
      }
    }

    res.json(booking);
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ message: 'Error updating booking status', error: error.message });
  }
});

// Update a booking
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.firebaseUid });
    const isAdmin = user && user.role === 'admin';

    const query = isAdmin ? { _id: req.params.id } : { _id: req.params.id, userId: req.user.firebaseUid };
    const booking = await Booking.findOne(query);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Don't allow updating userId
    delete req.body.userId;

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    ).populate('computerId');

    res.json(updatedBooking);
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ message: 'Error updating booking', error: error.message });
  }
});

// Delete a booking
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.firebaseUid });
    const isAdmin = user && user.role === 'admin';

    const query = isAdmin ? { _id: req.params.id } : { _id: req.params.id, userId: req.user.firebaseUid };
    const booking = await Booking.findOne(query);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ message: 'Error deleting booking', error: error.message });
  }
});

module.exports = router; 