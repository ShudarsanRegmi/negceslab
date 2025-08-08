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

// Pre-save middleware
bookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add index for common queries
bookingSchema.index({ computerId: 1, status: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
