const mongoose = require('mongoose');

const mealReminderLogSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    session: { type: String, enum: ['breakfast', 'lunch', 'dinner'], required: true },
    dateKey: { type: String, required: true },
    sentAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

mealReminderLogSchema.index({ student: 1, session: 1, dateKey: 1 }, { unique: true });

module.exports = mongoose.model('MealReminderLog', mealReminderLogSchema);
