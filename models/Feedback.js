const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    meal: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal' },
    reservation: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    category: { type: String, enum: ['food_quality', 'service', 'quantity', 'general'], default: 'general' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
