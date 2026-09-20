const express = require('express');
const router = express.Router();
const Meal = require('../models/Meal');
const Reservation = require('../models/Reservation');
const Feedback = require('../models/Feedback');
const MealReminderLog = require('../models/MealReminderLog');
const { ensureStudent } = require('../middleware/auth');
const { getCurrentMealSession, getNextMealSession, getSessionMeta, getMealReminder } = require('../utils/mealSessions');
const { parseLocalDate, toLocalDateString, dayRange } = require('../utils/dates');

router.get('/dashboard', ensureStudent, async (req, res) => {
  try {
    const reservations = await Reservation.find({ student: req.session.user.id, status: 'confirmed' })
      .populate('meal')
      .sort({ date: 1 })
      .limit(5);
    const totalReservations = await Reservation.countDocuments({ student: req.session.user.id });
    const { start } = dayRange(parseLocalDate());
    const upcomingCount = await Reservation.countDocuments({
      student: req.session.user.id,
      status: 'confirmed',
      date: { $gte: start }
    });
    const now = new Date();
    const currentSession = getCurrentMealSession(now);
    const nextSession = getNextMealSession(now);
    const reminderLookback = new Date(start);
    reminderLookback.setDate(reminderLookback.getDate() - 1);
    const reminderReservations = await Reservation.find({
      student: req.session.user.id,
      status: 'confirmed',
      date: { $gte: reminderLookback }
    })
      .populate('meal')
      .sort({ date: 1 });
    const emailReminderNotice = await MealReminderLog.exists({
      student: req.session.user.id,
      sentAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    res.render('student/dashboard', {
      title: 'Student Dashboard',
      reservations,
      totalReservations,
      upcomingCount,
      currentSession,
      nextSession,
      currentSessionMeta: getSessionMeta(currentSession),
      mealReminder: getMealReminder(reminderReservations, now),
      emailReminderNotice
    });
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/');
  }
});

router.get('/meals', ensureStudent, async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isAvailable: true };
    if (category) filter.category = category;
    const meals = await Meal.find(filter).sort({ session: 1, name: 1 });
    res.render('student/meals', {
      title: 'Available Meals',
      meals,
      category,
      currentSession: getCurrentMealSession(),
      nextSession: getNextMealSession()
    });
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/student/dashboard');
  }
});

router.get('/reserve/:mealId', ensureStudent, async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.mealId);
    if (!meal || !meal.isAvailable) {
      req.flash('error', 'Meal not available');
      return res.redirect('/student/meals');
    }
    res.render('student/reserve', { title: 'Make Reservation', meal, minDate: toLocalDateString(parseLocalDate()) });
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/student/meals');
  }
});

router.post('/reserve/:mealId', ensureStudent, async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.mealId);
    if (!meal || !meal.isAvailable) {
      req.flash('error', 'Meal not available');
      return res.redirect('/student/meals');
    }
    const { date, guestCount, notes } = req.body;
    const reservationDate = parseLocalDate(date);

    const existing = await Reservation.findOne({
      student: req.session.user.id,
      date: reservationDate,
      session: meal.session,
      status: 'confirmed'
    });
    if (existing) {
      req.flash('error', `You already have a ${meal.session} reservation for this date`);
      return res.redirect('/student/meals');
    }

    await Reservation.create({
      student: req.session.user.id,
      meal: meal._id,
      date: reservationDate,
      session: meal.session,
      guestCount: parseInt(guestCount, 10) || 0,
      notes
    });
    req.flash('success', 'Reservation created successfully!');
    res.redirect('/student/reservations');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/student/meals');
  }
});

router.get('/reservations', ensureStudent, async (req, res) => {
  try {
    const reservations = await Reservation.find({ student: req.session.user.id })
      .populate('meal')
      .sort({ date: -1, createdAt: -1 });
    res.render('student/reservations', { title: 'My Reservations', reservations });
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/student/dashboard');
  }
});

router.post('/reservations/:id/cancel', ensureStudent, async (req, res) => {
  try {
    const reservation = await Reservation.findOne({
      _id: req.params.id,
      student: req.session.user.id,
      status: 'confirmed'
    });
    if (!reservation) {
      req.flash('error', 'Reservation not found or already cancelled');
      return res.redirect('/student/reservations');
    }
    reservation.status = 'cancelled';
    await reservation.save();
    req.flash('success', 'Reservation cancelled');
    res.redirect('/student/reservations');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/student/reservations');
  }
});

router.get('/feedback', ensureStudent, async (req, res) => {
  try {
    const meals = await Meal.find({ isAvailable: true });
    const myFeedback = await Feedback.find({ student: req.session.user.id })
      .populate('meal')
      .sort({ createdAt: -1 });
    res.render('student/feedback', { title: 'Feedback', meals, myFeedback });
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/student/dashboard');
  }
});

router.post('/feedback', ensureStudent, async (req, res) => {
  try {
    const { meal, rating, comment, category } = req.body;
    await Feedback.create({
      student: req.session.user.id,
      meal: meal || undefined,
      rating: parseInt(rating, 10),
      comment,
      category
    });
    req.flash('success', 'Thank you for your feedback!');
    res.redirect('/student/feedback');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/student/feedback');
  }
});

module.exports = router;
