const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true,
    enum: [
      'General Feedback',
      'Technical Support',
      'Equipment Issue',
      'Booking Inquiry',
      'Suggestion',
      'Complaint',
      'Other'
    ]
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'resolved', 'in_progress'],
    default: 'pending'
  },
  adminResponse: {
    type: String,
    default: null
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

feedbackSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Feedback', feedbackSchema); 