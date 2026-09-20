const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    meal: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal', required: true },
    date: { type: Date, required: true },
    session: { type: String, enum: ['breakfast', 'lunch', 'dinner'], required: true },
    guestCount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['confirmed', 'cancelled', 'completed'], default: 'confirmed' },
    totalMeals: { type: Number, default: 1 },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

reservationSchema.pre('save', function (next) {
  this.totalMeals = 1 + (this.guestCount || 0);
  next();
});

module.exports = mongoose.model('Reservation', reservationSchema);
