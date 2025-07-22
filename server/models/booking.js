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
  date: {
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
  // New fields for GPU-related information
  requiresGPU: {
    type: Boolean,
    default: false
  },
  gpuMemoryRequired: {
    type: Number,
    min: 0,
    max: 48, // Maximum GPU memory in GB
    required: function() { return this.requiresGPU; }
  },
  problemStatement: {
    type: String,
    required: false // Make it optional for now since we're adding it to existing system
  },
  datasetType: {
    type: String,
    enum: ['Image', 'Video', 'Audio', 'Satellite', 'Text', 'Tabular', 'Time Series', 'Other'],
    required: false // Make it optional for now since we're adding it to existing system
  },
  datasetSize: {
    value: {
      type: Number,
      required: false // Make it optional for now since we're adding it to existing system
    },
    unit: {
      type: String,
      enum: ['MB', 'GB', 'TB'],
      required: false // Make it optional for now since we're adding it to existing system
    }
  },
  datasetLink: {
    type: String,
    required: false // Make it optional for now since we're adding it to existing system
  },
  bottleneckExplanation: {
    type: String,
    required: function() { return this.requiresGPU; }
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

bookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
