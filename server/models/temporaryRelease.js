const mongoose = require('mongoose');

const temporaryReleaseSchema = new mongoose.Schema({
  originalBookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  userId: {
    type: String, // Changed from ObjectId to String to store Firebase UID
    required: true
  },
  computerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Computer',
    required: true
  },
  releaseDates: [{
    type: Date,
    required: true
  }],
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'cancelled'],
    default: 'active'
  },
  tempBookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }]
}, {
  timestamps: true
});

// Virtual populate for user information
temporaryReleaseSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: 'firebaseUid', // Match with Firebase UID instead of _id
  justOne: true
});

// Virtual populate for original booking
temporaryReleaseSchema.virtual('originalBooking', {
  ref: 'Booking',
  localField: 'originalBookingId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware
temporaryReleaseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add indexes for common queries
temporaryReleaseSchema.index({ 
  computerId: 1, 
  status: 1, 
  releaseDates: 1
});
temporaryReleaseSchema.index({ userId: 1, status: 1 });
temporaryReleaseSchema.index({ originalBookingId: 1, status: 1 });

module.exports = mongoose.model('TemporaryRelease', temporaryReleaseSchema);
