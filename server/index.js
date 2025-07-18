const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const admin = require('firebase-admin');
const path = require('path');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
try {
  const serviceAccount = require('./config/serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('Error initializing Firebase Admin:', error.message);
  console.log('Please ensure serviceAccountKey.json is properly configured');
}

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://deepu6892:SaOkBEEl873q6ePc@negsuslabdb.g8yreln.mongodb.net/?retryWrites=true&w=majority&appName=Negsuslabdb';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import routes
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const slotRoutes = require('./routes/slots');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/slots', slotRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 