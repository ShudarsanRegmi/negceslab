const mongoose = require('mongoose');

const computerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  config: {
    type: Object, // Store configuration as JSON
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
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

computerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Computer', computerSchema); 