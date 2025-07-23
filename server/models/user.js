const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for user's bookings
userSchema.virtual('bookings', {
  ref: 'Booking',
  localField: 'firebaseUid',
  foreignField: 'userId'
});

// Compound index for common queries
userSchema.index({ role: 1, firebaseUid: 1 });

module.exports = mongoose.model('User', userSchema); 