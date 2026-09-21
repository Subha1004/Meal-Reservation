require('dotenv').config();

const connectDB = require('./config/db');
const app = require('./app');
const { startMealReminderScheduler } = require('./jobs/mealReminderJob');

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);

        if (!process.env.VERCEL) {
          startMealReminderScheduler();
        }
      });
    })
    .catch(() => {
      console.error('Server not started because MongoDB connection could not be established.');
      process.exit(1);
    });
}

module.exports = app;