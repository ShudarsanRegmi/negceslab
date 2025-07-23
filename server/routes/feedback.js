const express = require('express');
const router = express.Router();
const Feedback = require('../models/feedback');
const { verifyToken } = require('../middleware/auth');
const User = require('../models/user');

// Submit feedback (public route)
router.post('/', async (req, res) => {
  try {
    const { fullName, email, subject, message } = req.body;
    
    const feedback = new Feedback({
      fullName,
      email,
      subject,
      message
    });

    await feedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ message: 'Error submitting feedback', error: error.message });
  }
});

// Get all feedback (admin only)
router.get('/', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findOne({ firebaseUid: req.user.firebaseUid });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Error fetching feedback', error: error.message });
  }
});

// Update feedback status (admin only)
router.put('/:id/status', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.firebaseUid });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { status, adminResponse } = req.body;
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    feedback.status = status;
    if (adminResponse) {
      feedback.adminResponse = adminResponse;
    }

    await feedback.save();
    res.json(feedback);
  } catch (error) {
    console.error('Error updating feedback status:', error);
    res.status(500).json({ message: 'Error updating feedback status', error: error.message });
  }
});

module.exports = router; 