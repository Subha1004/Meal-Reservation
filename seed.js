require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Meal = require('./models/Meal');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/meal_reservation');
  console.log('Connected to MongoDB');
};

const seed = async () => {
  try {
    await connectDB();

    await User.deleteMany({ email: 'admin@meal.com' });
    await Meal.deleteMany({});

    await User.create({
      name: 'Admin User',
      email: 'admin@meal.com',
      password: 'admin123',
      role: 'admin'
    });
    console.log('Admin user created: admin@meal.com / admin123');

    const meals = [
      { name: 'Idli & Sambar', description: 'Steamed rice cakes with lentil soup', session: 'breakfast', category: 'vegetarian' },
      { name: 'Poha', description: 'Flattened rice with vegetables and peanuts', session: 'breakfast', category: 'vegetarian' },
      { name: 'Bread & Omelette', description: 'Toasted bread with egg omelette', session: 'breakfast', category: 'non-vegetarian' },
      { name: 'South Indian Thali', description: 'Rice, sambar, rasam, vegetables, curd', session: 'lunch', category: 'vegetarian' },
      { name: 'North Indian Thali', description: 'Roti, dal, sabzi, rice, salad', session: 'lunch', category: 'vegetarian' },
      { name: 'Chicken Biryani', description: 'Aromatic basmati rice with spiced chicken', session: 'lunch', category: 'non-vegetarian' },
      { name: 'Veg Fried Rice', description: 'Stir-fried rice with mixed vegetables', session: 'dinner', category: 'vegetarian' },
      { name: 'Chapati & Paneer Curry', description: 'Whole wheat flatbread with cottage cheese curry', session: 'dinner', category: 'vegetarian' },
      { name: 'Fish Curry & Rice', description: 'Traditional fish curry with steamed rice', session: 'dinner', category: 'non-vegetarian' }
    ];

    await Meal.insertMany(meals);
    console.log(`${meals.length} sample meals created`);

    console.log('\nSeed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seed();
