const express = require('express');
const router = express.Router();
const Booking = require('../models/booking');
const { verifyToken, isAdmin, isUser } = require('../middleware/auth');

// Get user's bookings
router.get('/user', [verifyToken, isUser], async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('slot')
      .sort('-createdAt');
    res.json(bookings);
  } catch (error) {
    console.error('Get User Bookings Error:', error);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

// Create new booking
router.post('/user', [verifyToken, isUser], async (req, res) => {
  try {
    const { slotId, purpose } = req.body;
    
    const booking = new Booking({
      user: req.user._id,
      slot: slotId,
      purpose,
      bookingDate: new Date()
    });

    await booking.save();
    res.status(201).json(booking);
  } catch (error) {
    console.error('Create Booking Error:', error);
    res.status(500).json({ message: 'Error creating booking' });
  }
});

// Cancel booking
router.delete('/user/:id', [verifyToken, isUser], async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = 'cancelled';
    await booking.save();
    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Cancel Booking Error:', error);
    res.status(500).json({ message: 'Error cancelling booking' });
  }
});

// Admin Routes

// Get all bookings (admin only)
router.get('/admin', [verifyToken, isAdmin], async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user')
      .populate('slot')
      .sort('-createdAt');
    res.json(bookings);
  } catch (error) {
    console.error('Get All Bookings Error:', error);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

// Update booking status (admin only)
router.put('/admin/:id', [verifyToken, isAdmin], async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = status;
    await booking.save();
    res.json(booking);
  } catch (error) {
    console.error('Update Booking Status Error:', error);
    res.status(500).json({ message: 'Error updating booking status' });
  }
});

module.exports = router; 