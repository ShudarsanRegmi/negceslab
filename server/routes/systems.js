const express = require('express');
const router = express.Router();
const System = require('../models/system');
const { verifyToken } = require('../middleware/auth');

// Get all systems
router.get('/', async (req, res) => {
  try {
    const systems = await System.find()
      .populate('currentUser.user', 'name email')
      .sort('systemNo');
    res.json(systems);
  } catch (error) {
    console.error('Get Systems Error:', error);
    res.status(500).json({ message: 'Error fetching systems' });
  }
});

// Book a system
router.post('/:systemId/book', verifyToken, async (req, res) => {
  try {
    const { purpose, startTime, endTime } = req.body;
    const system = await System.findById(req.params.systemId);
    
    if (!system) {
      return res.status(404).json({ message: 'System not found' });
    }
    
    if (system.status === 'in_use') {
      return res.status(400).json({ message: 'System is already in use' });
    }
    
    system.status = 'in_use';
    system.currentUser = {
      user: req.user._id,
      purpose,
      startTime,
      endTime
    };
    
    await system.save();
    res.json(system);
  } catch (error) {
    console.error('Book System Error:', error);
    res.status(500).json({ message: 'Error booking system' });
  }
});

// Release a system
router.post('/:systemId/release', verifyToken, async (req, res) => {
  try {
    const system = await System.findById(req.params.systemId);
    
    if (!system) {
      return res.status(404).json({ message: 'System not found' });
    }
    
    if (system.status !== 'in_use') {
      return res.status(400).json({ message: 'System is not in use' });
    }
    
    // Only allow the current user to release the system
    if (system.currentUser.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to release this system' });
    }
    
    system.status = 'available';
    system.currentUser = null;
    
    await system.save();
    res.json(system);
  } catch (error) {
    console.error('Release System Error:', error);
    res.status(500).json({ message: 'Error releasing system' });
  }
});

module.exports = router; 