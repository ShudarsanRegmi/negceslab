const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  computerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Computer',
    required: true,
    index: true
  },
  startDate: {
    type: String,
    required: true,
    index: true
  },
  endDate: {
    type: String,
    required: true,
    index: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed'],
    default: 'pending',
    index: true
  },
  rejectionReason: {
    type: String,
    required: function() { return this.status === 'rejected'; }
  },
  // Project-related information
  requiresGPU: {
    type: Boolean,
    default: false,
    required: true
  },
  gpuMemoryRequired: {
    type: Number,
    min: 0,
    max: 48,
    required: function() { return this.requiresGPU; }
  },
  problemStatement: {
    type: String,
    required: true
  },
  datasetType: {
    type: String,
    enum: ['Image', 'Video', 'Audio', 'Satellite', 'Text', 'Tabular', 'Time Series', 'Other'],
    required: true
  },
  datasetSize: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['MB', 'GB', 'TB'],
      required: true
    }
  },
  datasetLink: {
    type: String,
    required: true
  },
  bottleneckExplanation: {
    type: String,
    required: true
  },
  mentor: {
    type: String,
    default: undefined
  },
  
  // CORE TEMPORARY RELEASE INFO - Just the basics for fast queries
  temporaryRelease: {
    hasActiveReleases: {
      type: Boolean,
      default: false,
      index: true  // Fast querying for available slots
    },
    totalReleasedDays: {
      type: Number,
      default: 0
    },
    // Quick lookup array for released dates (for fast availability checking)
    releasedDates: [{
      date: {
        type: String, // YYYY-MM-DD format
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
      }
    }],
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  
  // System freed early tracking
  freedAt: {
    type: Date,
    default: undefined
  },
  freedBy: {
    type: String,
    ref: 'User',
    default: undefined
  },
  
  // For temporary bookings made on released dates
  isTemporaryBooking: {
    type: Boolean,
    default: false,
    index: true
  },
  originalBookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
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

// Virtual for user information
bookingSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: 'firebaseUid',
  justOne: true
});

// Virtual for temporary release details
bookingSchema.virtual('temporaryReleaseDetails', {
  ref: 'TemporaryReleaseDetail',
  localField: '_id',
  foreignField: 'bookingId'
});

// Virtual for temporary bookings made on this booking's released dates
bookingSchema.virtual('temporaryBookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'originalBookingId'
});

// Pre-save middleware
bookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Update temporary release summary
  if (this.temporaryRelease && this.isModified('temporaryRelease')) {
    this.temporaryRelease.lastUpdated = Date.now();
    this.temporaryRelease.totalReleasedDays = this.temporaryRelease.releasedDates?.length || 0;
    this.temporaryRelease.hasActiveReleases = this.temporaryRelease.totalReleasedDays > 0;
  }
  
  next();
});

// Indexes for efficient querying
bookingSchema.index({ computerId: 1, status: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ 
  'temporaryRelease.hasActiveReleases': 1, 
  'temporaryRelease.releasedDates.date': 1,
  'temporaryRelease.releasedDates.isBooked': 1
});
bookingSchema.index({ isTemporaryBooking: 1, originalBookingId: 1 });
bookingSchema.index({ computerId: 1, status: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
