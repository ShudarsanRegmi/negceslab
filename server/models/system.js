const mongoose = require('mongoose');

const systemSchema = new mongoose.Schema({
  systemNo: {
    type: Number,
    required: true,
    unique: true
  },
  specs: {
    processor: String,
    ram: String,
    storage: String,
    monitor: String,
    os: String
  },
  status: {
    type: String,
    enum: ['available', 'in_use'],
    default: 'available'
  },
  currentUser: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    purpose: String,
    startTime: Date,
    endTime: Date
  }
});

module.exports = mongoose.model('System', systemSchema); 