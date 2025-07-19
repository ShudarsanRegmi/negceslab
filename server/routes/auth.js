const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { verifyToken } = require('../middleware/auth');
const admin = require('firebase-admin');
const mongoose = require('mongoose'); // Added for database connection debugging

// Register new user (no token required as this is the initial registration)
router.post('/register', async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    console.log('Current database:', mongoose.connection.db.databaseName);
    console.log('Current collection:', User.collection.name);
    
    const { name, email } = req.body;
    
    console.log('Authorization header:', req.headers.authorization);
    const decodedToken = await admin.auth().verifyIdToken(
      req.headers.authorization?.split('Bearer ')[1]
    );
    const firebaseUid = decodedToken.uid;
    console.log('Firebase UID:', firebaseUid);

    // Check if user already exists
    let user = await User.findOne({ firebaseUid });
    console.log('Existing user check:', user ? 'Found' : 'Not found');
    if (user) {
      console.log('User already exists, returning:', user);
      return res.status(200).json(user); // User already exists, return the user
    }

    // Create new user
    console.log('Creating new user in MongoDB...');
    user = new User({
      firebaseUid,
      email,
      name,
      role: 'user' // Default role
    });

    console.log('User object to save:', user);
    await user.save();
    console.log('User saved successfully:', user);
    
    // Verify the user was actually saved
    const savedUser = await User.findOne({ firebaseUid });
    console.log('Verification - User found after save:', savedUser ? 'YES' : 'NO');
    
    res.status(201).json(user);
  } catch (error) {
    console.error('Register Error Details:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// Get current user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    // const user = await User.findOne({ firebaseUid: req.user.uid });
    // if (!user) {
    //   return res.status(404).json({ message: 'User not found' });
    // }
    // res.json(user);
    res.json(req.user); // req.user is already the user document
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