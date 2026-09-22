require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const adminRoutes = require('./routes/admin');
const { startMealReminderScheduler, sendUpcomingMealReminders } = require('./jobs/mealReminderJob');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection error:', error.message);
    res.status(500).send('Database connection failed.');
  }
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'meal_reservation_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
  })
);
app.use(flash());

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

app.get('/api/cron/meal-reminders', async (req, res) => {
  try {
    const configuredSecret = process.env.CRON_SECRET;
    const authorization = req.get('authorization') || '';
    const providedSecret = authorization.startsWith('Bearer ')
      ? authorization.slice(7)
      : req.get('x-cron-secret');

    if (configuredSecret && providedSecret !== configuredSecret) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    await sendUpcomingMealReminders();
    return res.json({ ok: true, message: 'Meal reminder job completed' });
  } catch (error) {
    console.error('Cron reminder endpoint failed:', error.message);
    return res.status(500).json({ ok: false, error: 'Reminder job failed' });
  }
});

app.get('/', (req, res) => {
  if (req.session.user) {
    if (req.session.user.role === 'admin') return res.redirect('/admin/dashboard');
    return res.redirect('/student/dashboard');
  }
  res.render('index', { title: 'Meal Reservation' });
});

app.use('/', authRoutes);
app.use('/student', studentRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

module.exports = app;
