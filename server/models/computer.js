const mongoose = require("mongoose");

const computerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  location: {
    type: String,
    required: true,
  },
  specifications: {
    type: String,
    default: "",
  },
  // Extended system details
  systemDetails: {
    operatingSystem: {
      type: String,
      enum: ['Windows', 'Linux', 'macOS', 'Dual Boot', 'WSL', 'VM on Linux', 'Other'],
      default: 'Windows'
    },
    osVersion: {
      type: String,
      default: ""
    },
    architecture: {
      type: String,
      enum: ['x86_64', 'ARM64', 'Other'],
      default: 'x86_64'
    },
    processor: {
      type: String,
      default: ""
    },
    ram: {
      type: String,
      default: ""
    },
    storage: {
      type: String,
      default: ""
    },
    gpu: {
      type: String,
      default: ""
    },
    installedSoftware: [{
      name: {
        type: String,
        required: true
      },
      version: {
        type: String,
        default: ""
      },
      category: {
        type: String,
        enum: ['Development', 'Design', 'Analysis', 'Office', 'Other'],
        default: 'Other'
      },
      icon: {
        type: String,
        default: "💻"
      }
    }],
    additionalNotes: {
      type: String,
      default: ""
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for bookings
computerSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'computerId'
});

module.exports = mongoose.model("Computer", computerSchema);
