const express = require('express');
const router = express.Router();
const Computer = require('../models/computer');
const { verifyToken } = require('../middleware/auth');
const { softwarePool, osIcons } = require('../data/softwarePool');

// Get software pool and OS icons (public access)
router.get('/public/software-pool', async (req, res) => {
  try {
    res.json({ softwarePool, osIcons });
  } catch (error) {
    console.error('Error fetching software pool:', error);
    res.status(500).json({ message: 'Error fetching software pool', error: error.message });
  }
});

// Get all computers with system details (public access)
router.get('/public', async (req, res) => {
  try {
    const computers = await Computer.find().sort({ name: 1 });
    res.json(computers);
  } catch (error) {
    console.error('Error fetching system details:', error);
    res.status(500).json({ message: 'Error fetching system details', error: error.message });
  }
});

// Get software pool and OS icons (authenticated)
router.get('/software-pool', verifyToken, async (req, res) => {
  try {
    res.json({ softwarePool, osIcons });
  } catch (error) {
    console.error('Error fetching software pool:', error);
    res.status(500).json({ message: 'Error fetching software pool', error: error.message });
  }
});

// Get all computers with system details (available to all authenticated users)
router.get('/', verifyToken, async (req, res) => {
  try {
    const computers = await Computer.find().sort({ name: 1 });
    res.json(computers);
  } catch (error) {
    console.error('Error fetching system details:', error);
    res.status(500).json({ message: 'Error fetching system details', error: error.message });
  }
});

// Get system details for a specific computer (admin only)
router.get('/:computerId', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    const user = await require('../models/user').findOne({ firebaseUid: req.user.firebaseUid });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const computer = await Computer.findById(req.params.computerId);
    if (!computer) {
      return res.status(404).json({ message: 'Computer not found' });
    }

    res.json(computer);
  } catch (error) {
    console.error('Error fetching computer system details:', error);
    res.status(500).json({ message: 'Error fetching computer system details', error: error.message });
  }
});

// Update system details for a computer (admin only)
router.put('/:computerId', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    const user = await require('../models/user').findOne({ firebaseUid: req.user.firebaseUid });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const {
      operatingSystem,
      osVersion,
      architecture,
      processor,
      ram,
      storage,
      gpu,
      installedSoftware,
      additionalNotes
    } = req.body;

    const computer = await Computer.findById(req.params.computerId);
    if (!computer) {
      return res.status(404).json({ message: 'Computer not found' });
    }

    // Update system details
    computer.systemDetails = {
      operatingSystem: operatingSystem || computer.systemDetails?.operatingSystem || 'Windows',
      osVersion: osVersion || computer.systemDetails?.osVersion || '',
      architecture: architecture || computer.systemDetails?.architecture || 'x86_64',
      processor: processor || computer.systemDetails?.processor || '',
      ram: ram || computer.systemDetails?.ram || '',
      storage: storage || computer.systemDetails?.storage || '',
      gpu: gpu || computer.systemDetails?.gpu || '',
      installedSoftware: installedSoftware || computer.systemDetails?.installedSoftware || [],
      additionalNotes: additionalNotes || computer.systemDetails?.additionalNotes || '',
      lastUpdated: new Date()
    };

    await computer.save();
    res.json(computer);
  } catch (error) {
    console.error('Error updating system details:', error);
    res.status(500).json({ message: 'Error updating system details', error: error.message });
  }
});

// Add software to a computer (admin only)
router.post('/:computerId/software', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    const user = await require('../models/user').findOne({ firebaseUid: req.user.firebaseUid });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { name, version, category, icon } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Software name is required' });
    }

    const computer = await Computer.findById(req.params.computerId);
    if (!computer) {
      return res.status(404).json({ message: 'Computer not found' });
    }

    // Initialize systemDetails if it doesn't exist
    if (!computer.systemDetails) {
      computer.systemDetails = {
        operatingSystem: 'Windows',
        osVersion: '',
        architecture: 'x86_64',
        processor: '',
        ram: '',
        storage: '',
        gpu: '',
        installedSoftware: [],
        additionalNotes: '',
        lastUpdated: new Date()
      };
    }

    // Add new software
    computer.systemDetails.installedSoftware.push({
      name,
      version: version || '',
      category: category || 'Other',
      icon: icon || '💻'
    });

    computer.systemDetails.lastUpdated = new Date();
    await computer.save();

    res.json(computer);
  } catch (error) {
    console.error('Error adding software:', error);
    res.status(500).json({ message: 'Error adding software', error: error.message });
  }
});

// Remove software from a computer (admin only)
router.delete('/:computerId/software/:softwareIndex', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    const user = await require('../models/user').findOne({ firebaseUid: req.user.firebaseUid });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const computer = await Computer.findById(req.params.computerId);
    if (!computer) {
      return res.status(404).json({ message: 'Computer not found' });
    }

    const softwareIndex = parseInt(req.params.softwareIndex);
    if (softwareIndex < 0 || softwareIndex >= computer.systemDetails?.installedSoftware?.length) {
      return res.status(400).json({ message: 'Invalid software index' });
    }

    computer.systemDetails.installedSoftware.splice(softwareIndex, 1);
    computer.systemDetails.lastUpdated = new Date();
    await computer.save();

    res.json(computer);
  } catch (error) {
    console.error('Error removing software:', error);
    res.status(500).json({ message: 'Error removing software', error: error.message });
  }
});

module.exports = router; 