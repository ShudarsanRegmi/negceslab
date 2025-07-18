const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    default: 1
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  lab: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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

// Validate that endTime is after startTime
slotSchema.pre('save', function(next) {
  if (this.endTime <= this.startTime) {
    next(new Error('End time must be after start time'));
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Slot', slotSchema); 