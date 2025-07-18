const express = require('express');
const router = express.Router();
const Slot = require('../models/slot');
const { verifyToken, isAdmin, isUser } = require('../middleware/auth');

// Get all available slots (accessible to all authenticated users)
router.get('/', verifyToken, async (req, res) => {
  try {
    const slots = await Slot.find({ isAvailable: true })
      .sort('startTime')
      .populate('createdBy', 'name');
    res.json(slots);
  } catch (error) {
    console.error('Get Slots Error:', error);
    res.status(500).json({ message: 'Error fetching slots' });
  }
});

// Admin Routes

// Create new slot (admin only)
router.post('/admin', [verifyToken, isAdmin], async (req, res) => {
  try {
    const { startTime, endTime, capacity, lab, description } = req.body;
    
    const slot = new Slot({
      startTime,
      endTime,
      capacity,
      lab,
      description,
      createdBy: req.user._id
    });

    await slot.save();
    res.status(201).json(slot);
  } catch (error) {
    console.error('Create Slot Error:', error);
    res.status(500).json({ message: 'Error creating slot' });
  }
});

// Update slot (admin only)
router.put('/admin/:id', [verifyToken, isAdmin], async (req, res) => {
  try {
    const { startTime, endTime, capacity, isAvailable, lab, description } = req.body;
    const slot = await Slot.findById(req.params.id);

    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    // Update fields
    if (startTime) slot.startTime = startTime;
    if (endTime) slot.endTime = endTime;
    if (capacity) slot.capacity = capacity;
    if (typeof isAvailable === 'boolean') slot.isAvailable = isAvailable;
    if (lab) slot.lab = lab;
    if (description) slot.description = description;

    await slot.save();
    res.json(slot);
  } catch (error) {
    console.error('Update Slot Error:', error);
    res.status(500).json({ message: 'Error updating slot' });
  }
});

// Delete slot (admin only)
router.delete('/admin/:id', [verifyToken, isAdmin], async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);

    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    await slot.remove();
    res.json({ message: 'Slot deleted successfully' });
  } catch (error) {
    console.error('Delete Slot Error:', error);
    res.status(500).json({ message: 'Error deleting slot' });
  }
});

module.exports = router; 