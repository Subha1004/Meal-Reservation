const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    session: { type: String, enum: ['breakfast', 'lunch', 'dinner'], required: true },
    category: { type: String, enum: ['vegetarian', 'non-vegetarian', 'vegan'], default: 'vegetarian' },
    isAvailable: { type: Boolean, default: true },
    imageUrl: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Meal', mealSchema);
