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
