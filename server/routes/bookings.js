const express = require('express');
const router = express.Router();
const Booking = require('../models/booking');
const Computer = require('../models/slot'); // slot.js is now the Computer model
const { verifyToken, isAdmin, isUser } = require('../middleware/auth');

// User: Request a booking
router.post('/', [verifyToken, isUser], async (req, res) => {
  try {
    const { computerId, reason, startTime, endTime } = req.body;
    // Check if computer exists
    const computer = await Computer.findById(computerId);
    if (!computer) {
      return res.status(404).json({ message: 'Computer not found' });
    }
    // Check for overlapping bookings (approved or pending)
    const overlapping = await Booking.findOne({
      computer: computerId,
      status: { $in: ['pending', 'approved'] },
      $or: [
        { startTime: { $lt: new Date(endTime), $gte: new Date(startTime) } },
        { endTime: { $gt: new Date(startTime), $lte: new Date(endTime) } },
        { startTime: { $lte: new Date(startTime) }, endTime: { $gte: new Date(endTime) } }
      ]
    });
    if (overlapping) {
      return res.status(409).json({ message: 'Computer is already booked for the selected time' });
    }
    const booking = new Booking({
      user: req.user._id,
      computer: computerId,
      reason,
      startTime,
      endTime
    });
    await booking.save();
    res.status(201).json(booking);
  } catch (error) {
    console.error('Create Booking Error:', error);
    res.status(500).json({ message: 'Error creating booking' });
  }
});

// User: View their bookings
router.get('/my', [verifyToken, isUser], async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('computer');
    res.json(bookings);
  } catch (error) {
    console.error('Get My Bookings Error:', error);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

// Admin: View all bookings
router.get('/', [verifyToken, isAdmin], async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user')
      .populate('computer');
    res.json(bookings);
  } catch (error) {
    console.error('Get All Bookings Error:', error);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

// Admin: Approve or reject a booking
router.put('/:id', [verifyToken, isAdmin], async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    console.error('Update Booking Status Error:', error);
    res.status(500).json({ message: 'Error updating booking status' });
  }
});

module.exports = router; 