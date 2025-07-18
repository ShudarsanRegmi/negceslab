const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  slot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Slot',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  bookingDate: {
    type: Date,
    required: true
  },
  purpose: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
bookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Booking', bookingSchema); 