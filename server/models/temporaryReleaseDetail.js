const mongoose = require('mongoose');

const temporaryReleaseDetailSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  
  // Each document represents one "release action" by the user
  releaseNumber: {
    type: Number,
    required: true,
    default: 1
  },
  
  // The specific dates released in this action
  releasedDates: [{
    type: String, // YYYY-MM-DD
    required: true
  }],
  
  reason: {
    type: String,
    required: true,
    trim: true
  },
  
  status: {
    type: String,
    enum: ['active', 'cancelled', 'partially_booked'],
    default: 'active',
    index: true
  },
  
  // Tracking which dates have been booked by others
  bookingDetails: [{
    date: {
      type: String,
      required: true
    },
    isBooked: {
      type: Boolean,
      default: false
    },
    tempBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null
    },
    bookedBy: {
      type: String,
      ref: 'User',
      default: null
    },
    bookedAt: {
      type: Date,
      default: null
    }
  }],
  
  // Metadata for tracking user actions
  releaseContext: {
    userMessage: String, // e.g., "Need to release tomorrow for personal work"
    releaseType: {
      type: String,
      enum: ['single_day', 'multiple_days', 'range', 'admin_created'],
      default: 'single_day'
    },
    isEmergency: {
      type: Boolean,
      default: false
    },
    // Admin-specific fields
    createdByAdmin: {
      type: Boolean,
      default: false
    },
    adminId: {
      type: String,
      ref: 'User',
      default: null
    }
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for original booking
temporaryReleaseDetailSchema.virtual('originalBooking', {
  ref: 'Booking',
  localField: 'bookingId',
  foreignField: '_id',
  justOne: true
});

// Virtual for user information
temporaryReleaseDetailSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: 'firebaseUid',
  justOne: true
});

// Compound indexes
temporaryReleaseDetailSchema.index({ bookingId: 1, releaseNumber: 1 });
temporaryReleaseDetailSchema.index({ userId: 1, status: 1, createdAt: -1 });
temporaryReleaseDetailSchema.index({ 
  'bookingDetails.date': 1, 
  'bookingDetails.isBooked': 1,
  status: 1
});

// Pre-save middleware
temporaryReleaseDetailSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Initialize booking details if not present
  if (!this.bookingDetails || this.bookingDetails.length === 0) {
    this.bookingDetails = this.releasedDates.map(date => ({
      date,
      isBooked: false,
      tempBookingId: null,
      bookedBy: null,
      bookedAt: null
    }));
  }
  
  // Update status based on booking details
  const totalDates = this.bookingDetails.length;
  const bookedDates = this.bookingDetails.filter(bd => bd.isBooked).length;
  
  if (bookedDates === 0 && this.status !== 'cancelled') {
    this.status = 'active';
  } else if (bookedDates > 0 && bookedDates < totalDates) {
    this.status = 'partially_booked';
  }
  
  next();
});

// Static method to get next release number for a booking
temporaryReleaseDetailSchema.statics.getNextReleaseNumber = async function(bookingId) {
  const lastRelease = await this.findOne({ bookingId }).sort({ releaseNumber: -1 });
  return lastRelease ? lastRelease.releaseNumber + 1 : 1;
};

module.exports = mongoose.model('TemporaryReleaseDetail', temporaryReleaseDetailSchema);
