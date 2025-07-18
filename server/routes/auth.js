const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { verifyToken } = require('../middleware/auth');
const admin = require('firebase-admin');

// Register new user (no token required as this is the initial registration)
router.post('/register', async (req, res) => {
  try {
    const { name, email } = req.body;
    const decodedToken = await admin.auth().verifyIdToken(
      req.headers.authorization?.split('Bearer ')[1]
    );
    const firebaseUid = decodedToken.uid;

    // Check if user already exists
    let user = await User.findOne({ firebaseUid });
    if (user) {
      return res.status(200).json(user); // User already exists, return the user
    }

    // Create new user
    user = new User({
      firebaseUid,
      email,
      name,
      role: 'user' // Default role
    });

    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Get current user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Profile Error:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Update user role (admin only)
router.put('/role/:userId', verifyToken, async (req, res) => {
  try {
    const adminUser = await User.findOne({ firebaseUid: req.user.uid });
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = req.body.role;
    await user.save();
    res.json(user);
  } catch (error) {
    console.error('Update Role Error:', error);
    res.status(500).json({ message: 'Error updating user role' });
  }
});

module.exports = router; 