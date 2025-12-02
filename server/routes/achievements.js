const express = require('express');
const router = express.Router();
const Achievement = require('../models/achievement');
const { verifyToken } = require('../middleware/auth');
const User = require('../models/user');

// Get all published achievements (public route)
router.get('/public', async (req, res) => {
  try {
    const achievements = await Achievement.find({ 
      status: 'published' 
    }).sort({ publishedAt: -1 });
    
    res.json(achievements);
  } catch (error) {
    console.error('Error fetching published achievements:', error);
    res.status(500).json({ message: 'Error fetching achievements', error: error.message });
  }
});

// Get all achievements (admin only)
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.firebaseUid });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const achievements = await Achievement.find().sort({ createdAt: -1 });
    res.json(achievements);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ message: 'Error fetching achievements', error: error.message });
  }
});

// Get single achievement by ID
router.get('/:id', async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id);
    
    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }

    // If not admin, only allow access to published achievements
    if (!req.headers.authorization) {
      if (achievement.status !== 'published') {
        return res.status(404).json({ message: 'Achievement not found' });
      }
    }

    res.json(achievement);
  } catch (error) {
    console.error('Error fetching achievement:', error);
    res.status(500).json({ message: 'Error fetching achievement', error: error.message });
  }
});

// Create new achievement (admin only)
router.post('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.firebaseUid });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const {
      title,
      author,
      content,
      excerpt,
      tags,
      date,
      status,
      featuredImage
    } = req.body;

    const achievement = new Achievement({
      title,
      author,
      content,
      excerpt,
      tags: Array.isArray(tags) ? tags : [],
      date,
      status: status || 'draft',
      featuredImage,
      createdBy: req.user.firebaseUid
    });

    await achievement.save();
    res.status(201).json(achievement);
  } catch (error) {
    console.error('Error creating achievement:', error);
    res.status(500).json({ message: 'Error creating achievement', error: error.message });
  }
});

// Update achievement (admin only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.firebaseUid });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const achievement = await Achievement.findById(req.params.id);
    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }

    const {
      title,
      author,
      content,
      excerpt,
      tags,
      date,
      status,
      featuredImage
    } = req.body;

    // Update fields if provided
    if (title !== undefined) achievement.title = title;
    if (author !== undefined) achievement.author = author;
    if (content !== undefined) achievement.content = content;
    if (excerpt !== undefined) achievement.excerpt = excerpt;
    if (tags !== undefined) achievement.tags = Array.isArray(tags) ? tags : [];
    if (date !== undefined) achievement.date = date;
    if (status !== undefined) achievement.status = status;
    if (featuredImage !== undefined) achievement.featuredImage = featuredImage;

    await achievement.save();
    res.json(achievement);
  } catch (error) {
    console.error('Error updating achievement:', error);
    res.status(500).json({ message: 'Error updating achievement', error: error.message });
  }
});

// Delete achievement (admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.firebaseUid });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const achievement = await Achievement.findById(req.params.id);
    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }

    await Achievement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Achievement deleted successfully' });
  } catch (error) {
    console.error('Error deleting achievement:', error);
    res.status(500).json({ message: 'Error deleting achievement', error: error.message });
  }
});

// Update achievement status (admin only)
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.firebaseUid });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { status } = req.body;
    if (!['draft', 'published', 'hidden'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const achievement = await Achievement.findById(req.params.id);
    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }

    achievement.status = status;
    await achievement.save();
    
    res.json(achievement);
  } catch (error) {
    console.error('Error updating achievement status:', error);
    res.status(500).json({ message: 'Error updating achievement status', error: error.message });
  }
});

module.exports = router;
