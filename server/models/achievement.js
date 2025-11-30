const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    maxlength: 200
  },
  tags: [{
    type: String,
    required: true
  }],
  date: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'hidden'],
    default: 'draft'
  },
  featuredImage: {
    type: String,
    default: null
  },
  createdBy: {
    type: String, // Firebase UID
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  publishedAt: {
    type: Date,
    default: null
  }
});

achievementSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model('Achievement', achievementSchema);
