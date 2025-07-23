const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  computerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Computer',
    required: true
  },
  startDate: {
    type: String,
    required: true
  },
  endDate: {
    type: String,
    required: true
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
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
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
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware
bookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
