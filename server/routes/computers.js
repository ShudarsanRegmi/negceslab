const express = require('express');
const router = express.Router();
const Computer = require('../models/slot'); // slot.js is now the Computer model
const { verifyToken, isAdmin } = require('../middleware/auth');

// Admin: Add a new computer
router.post('/', [verifyToken, isAdmin], async (req, res) => {
  try {
    const { name, config } = req.body;
    const computer = new Computer({ name, config });
    await computer.save();
    res.status(201).json(computer);
  } catch (error) {
    console.error('Add Computer Error:', error);
    res.status(500).json({ message: 'Error adding computer' });
  }
});

// Admin: Update a computer
router.put('/:id', [verifyToken, isAdmin], async (req, res) => {
  try {
    const { name, config, isAvailable } = req.body;
    const computer = await Computer.findByIdAndUpdate(
      req.params.id,
      { name, config, isAvailable },
      { new: true }
    );
    if (!computer) {
      return res.status(404).json({ message: 'Computer not found' });
    }
    res.json(computer);
  } catch (error) {
    console.error('Update Computer Error:', error);
    res.status(500).json({ message: 'Error updating computer' });
  }
});

// List all computers (public, but can be protected if needed)
router.get('/', async (req, res) => {
  try {
    const computers = await Computer.find();
    res.json(computers);
  } catch (error) {
    console.error('List Computers Error:', error);
    res.status(500).json({ message: 'Error fetching computers' });
  }
});

module.exports = router; 