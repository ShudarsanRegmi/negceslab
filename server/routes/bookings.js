const express = require('express');
const router = express.Router();
const Booking = require('../models/booking');
const Computer = require('../models/computer');
const { verifyToken } = require('../middleware/auth');

// Create a new booking
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      computerId,
      date,
      startTime,
      endTime,
      reason,
      requiresGPU,
      gpuMemoryRequired,
      problemStatement,
      datasetType,
      datasetLink,
      bottleneckExplanation
    } = req.body;

    // Basic validation
    if (!computerId || !date || !startTime || !endTime || !reason) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // If GPU is required, validate GPU-specific fields
    if (requiresGPU && (!gpuMemoryRequired || !bottleneckExplanation)) {
      return res.status(400).json({ message: 'GPU-specific fields are required when GPU is requested' });
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
      reason,
      requiresGPU,
      gpuMemoryRequired,
      problemStatement,
      datasetType,
      datasetLink,
      bottleneckExplanation
    });

    await booking.save();
    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Error creating booking', error: error.message });
  }
});

// Get all bookings for the current user
router.get('/', verifyToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.firebaseUid })
      .populate('computerId')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
});

// Get a specific booking
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      userId: req.user.firebaseUid
    }).populate('computerId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Error fetching booking', error: error.message });
  }
});

// Update a booking
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      userId: req.user.firebaseUid
    });

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
    const booking = await Booking.findOne({
      _id: req.params.id,
      userId: req.user.firebaseUid
    });

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