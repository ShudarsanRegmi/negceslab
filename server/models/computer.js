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
  status: {
    type: String,
    enum: ["available", "maintenance", "reserved"],
    default: "available", // Default status
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
  isOnline: {
    type: Boolean,
    default: false,
    index: true,
  },
  agentToken: {
    type: String,
    default: "",
    index: true,
  },
  lastSeen: {
    type: Date,
    default: null,
  },
  agentActiveSession: {
    currentUser: { type: String, default: "" },
    email: { type: String, default: "" },
    agenda: { type: String, default: "" },
    checkInTime: { type: Date, default: null },
    sessionType: { type: String, default: "" },
    checkedIn: { type: Boolean, default: false },
    activeBookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  },
  liveMetrics: {
    cpuUtil: { type: Number, default: 0 },
    ramUtil: { type: Number, default: 0 },
    gpuUtil: { type: Number, default: 0 },
    gpuMemUsed: { type: Number, default: 0 },
    gpuMemTotal: { type: Number, default: 0 },
    netSentSpeed: { type: Number, default: 0 },
    netRecvSpeed: { type: Number, default: 0 },
    diskUtil: { type: Number, default: 0 },
    cpuTemp: { type: Number, default: 0 },
    gpuTemp: { type: Number, default: 0 },
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
