const mongoose = require("mongoose");

const attendanceLogSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  computerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Computer',
    required: true,
    index: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null,
    index: true
  },
  userId: {
    type: String,
    default: "",
    index: true
  },
  studentName: {
    type: String,
    required: true
  },
  studentEmail: {
    type: String,
    required: true,
    index: true
  },
  department: {
    type: String,
    default: ""
  },
  entryType: {
    type: String,
    enum: ['RESERVED_BOOKING', 'WALK_IN', 'ADMIN_OVERRIDE'],
    default: 'WALK_IN',
    index: true
  },
  agenda: {
    type: String,
    default: 'General Work'
  },
  sessionType: {
    type: String,
    default: 'Physical GUI'
  },
  osType: {
    type: String,
    enum: ['windows', 'linux', 'darwin', 'unknown'],
    default: 'unknown'
  },
  osHostname: {
    type: String,
    default: ""
  },
  macAddress: {
    type: String,
    default: ""
  },
  hardwareUuid: {
    type: String,
    default: "",
    index: true
  },
  checkInTime: {
    type: Date,
    default: Date.now,
    index: true
  },
  checkOutTime: {
    type: Date,
    default: null
  },
  lastHeartbeat: {
    type: Date,
    default: Date.now
  },
  durationMinutes: {
    type: Number,
    default: 0
  },
  sessionStatus: {
    type: String,
    enum: ['ACTIVE', 'COMPLETED', 'AUTO_CLOSED_REBOOT', 'ADMIN_TERMINATED'],
    default: 'ACTIVE',
    index: true
  },
  slotConflict: {
    type: Boolean,
    default: false
  },
  segments: [{
    checkIn: { type: Date, default: Date.now },
    checkOut: { type: Date, default: null },
    osType: { type: String, default: 'unknown' },
    reason: { type: String, enum: ['INITIAL', 'RE_CHECKIN', 'OS_SWITCH'], default: 'INITIAL' }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate for Computer details
attendanceLogSchema.virtual('computer', {
  ref: 'Computer',
  localField: 'computerId',
  foreignField: '_id',
  justOne: true
});

// Virtual populate for Booking details
attendanceLogSchema.virtual('booking', {
  ref: 'Booking',
  localField: 'bookingId',
  foreignField: '_id',
  justOne: true
});

// Compound indexes for high performance admin queries
attendanceLogSchema.index({ computerId: 1, checkInTime: -1 });
attendanceLogSchema.index({ studentEmail: 1, checkInTime: -1 });
attendanceLogSchema.index({ checkInTime: -1, sessionStatus: 1 });
attendanceLogSchema.index({ hardwareUuid: 1, sessionStatus: 1 });

module.exports = mongoose.model('AttendanceLog', attendanceLogSchema);
