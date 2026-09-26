const express = require('express');
const router = express.Router();
const Meal = require('../models/Meal');
const Reservation = require('../models/Reservation');
const Attendance = require('../models/Attendance');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const { ensureAdmin } = require('../middleware/auth');
const { parseLocalDate, toLocalDateString, dayRange } = require('../utils/dates');

router.get('/dashboard', ensureAdmin, async (req, res) => {
  try {
    const { start, end } = dayRange(parseLocalDate());

    const todayReservations = await Reservation.find({
      date: { $gte: start, $lt: end },
      status: { $in: ['confirmed', 'completed'] }
    }).populate('student meal');

    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalMeals = await Meal.countDocuments();
    const pendingFeedback = await Feedback.countDocuments();

    const mealTotals = todayReservations.reduce(
      (acc, r) => {
        acc.studentMeals += 1;
        acc.guestMeals += r.guestCount || 0;
        acc.totalMeals += r.totalMeals || 1 + (r.guestCount || 0);
        return acc;
      },
      { studentMeals: 0, guestMeals: 0, totalMeals: 0 }
    );

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      todayReservations,
      totalStudents,
      totalMeals,
      pendingFeedback,
      mealTotals
    });
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/');
  }
});

router.get('/meals', ensureAdmin, async (req, res) => {
  try {
    const meals = await Meal.find().sort({ session: 1, name: 1 });
    res.render('admin/meals', { title: 'Manage Meals', meals });
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/admin/dashboard');
  }
});

router.post('/meals', ensureAdmin, async (req, res) => {
  try {
    const { name, description, session, category, isAvailable } = req.body;
    await Meal.create({
      name,
      description,
      session,
      category,
      isAvailable: isAvailable === 'on'
    });
    req.flash('success', 'Meal added successfully');
    res.redirect('/admin/meals');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/admin/meals');
  }
});

router.post('/meals/:id/update', ensureAdmin, async (req, res) => {
  try {
    const { name, description, session, category, isAvailable } = req.body;
    await Meal.findByIdAndUpdate(req.params.id, {
      name,
      description,
      session,
      category,
      isAvailable: isAvailable === 'on'
    });
    req.flash('success', 'Meal updated successfully');
    res.redirect('/admin/meals');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/admin/meals');
  }
});

router.post('/meals/:id/delete', ensureAdmin, async (req, res) => {
  try {
    await Meal.findByIdAndDelete(req.params.id);
    req.flash('success', 'Meal deleted');
    res.redirect('/admin/meals');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/admin/meals');
  }
});

router.get('/reservations', ensureAdmin, async (req, res) => {
  try {
    const { date, session, status } = req.query;
    const filter = {};
    if (date) {
      const { start, end } = dayRange(parseLocalDate(date));
      filter.date = { $gte: start, $lt: end };
    }
    if (session) filter.session = session;
    if (status) filter.status = status;

    const reservations = await Reservation.find(filter)
      .populate('student meal')
      .sort({ date: -1, session: 1 });
    res.render('admin/reservations', { title: 'Manage Reservations', reservations, date, session, status });
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/admin/dashboard');
  }
});

router.post('/reservations/:id/status', ensureAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    await Reservation.findByIdAndUpdate(req.params.id, { status });
    req.flash('success', 'Reservation status updated');
    res.redirect('/admin/reservations');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/admin/reservations');
  }
});

router.get('/attendance', ensureAdmin, async (req, res) => {
  try {
    const { date, session } = req.query;
    const filterDate = parseLocalDate(date);
    const { start, end } = dayRange(filterDate);

    const reservationFilter = {
      date: { $gte: start, $lt: end },
      status: { $in: ['confirmed', 'completed'] }
    };
    if (session) reservationFilter.session = session;

    const reservations = await Reservation.find(reservationFilter)
      .populate('student meal')
      .sort({ session: 1 });

    const attendanceRecords = await Attendance.find({
      date: { $gte: start, $lt: end }
    });
    const attendanceMap = {};
    attendanceRecords.forEach((a) => {
      attendanceMap[a.reservation.toString()] = a;
    });

    res.render('admin/attendance', {
      title: 'Record Attendance',
      reservations,
      attendanceMap,
      date: toLocalDateString(filterDate),
      session: session || ''
    });
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/admin/dashboard');
  }
});

router.post('/attendance/:reservationId', ensureAdmin, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.reservationId).populate('student');
    if (!reservation) {
      req.flash('error', 'Reservation not found');
      return res.redirect('/admin/attendance');
    }

    const { attended, guestAttended, remarks } = req.body;
    const isAttended = attended === 'on';
    const guestCount = parseInt(guestAttended, 10) || 0;

    await Attendance.findOneAndUpdate(
      { reservation: reservation._id },
      {
        reservation: reservation._id,
        student: reservation.student._id,
        date: reservation.date,
        session: reservation.session,
        attended: isAttended,
        guestAttended: guestCount,
        isNoShow: !isAttended,
        recordedBy: req.session.user.id,
        remarks
      },
      { upsert: true, new: true }
    );

    if (isAttended) {
      reservation.status = 'completed';
      await reservation.save();
    }

    req.flash('success', 'Attendance recorded');
    res.redirect(`/admin/attendance?date=${toLocalDateString(reservation.date)}&session=${reservation.session}`);
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/admin/attendance');
  }
});

router.get('/feedback', ensureAdmin, async (req, res) => {
  try {
    const feedbackList = await Feedback.find()
      .populate('student meal')
      .sort({ createdAt: -1 });
    const avgRating =
      feedbackList.length > 0
        ? (feedbackList.reduce((sum, f) => sum + f.rating, 0) / feedbackList.length).toFixed(1)
        : 0;
    res.render('admin/feedback', { title: 'View Feedback', feedbackList, avgRating });
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/admin/dashboard');
  }
});

router.get('/reports', ensureAdmin, async (req, res) => {
  try {
    const { date, session } = req.query;
    const filterDate = parseLocalDate(date);
    const { start, end } = dayRange(filterDate);

    const reservationFilter = {
      date: { $gte: start, $lt: end },
      status: { $in: ['confirmed', 'completed'] }
    };
    if (session) reservationFilter.session = session;

    const reservations = await Reservation.find(reservationFilter).populate('meal student');

    const sessionWise = {
      breakfast: { student: 0, guest: 0, total: 0 },
      lunch: { student: 0, guest: 0, total: 0 },
      dinner: { student: 0, guest: 0, total: 0 }
    };
    const mealWise = {};
    const categoryWise = { vegetarian: 0, 'non-vegetarian': 0, vegan: 0 };

    reservations.forEach((r) => {
      const sess = r.session;
      const guestCount = r.guestCount || 0;
      const totalMeals = r.totalMeals || (1 + guestCount);

      if (sessionWise[sess]) {
        sessionWise[sess].student += 1;
        sessionWise[sess].guest += guestCount;
        sessionWise[sess].total += totalMeals;
      }

      const mealName = r.meal ? r.meal.name : 'Unknown';
      if (!mealWise[mealName]) mealWise[mealName] = { student: 0, guest: 0, total: 0, session: sess };
      mealWise[mealName].student += 1;
      mealWise[mealName].guest += guestCount;
      mealWise[mealName].total += totalMeals;

      if (r.meal && categoryWise[r.meal.category] !== undefined) {
        categoryWise[r.meal.category] += totalMeals;
      }
    });

    const attendanceFilter = { date: { $gte: start, $lt: end } };
    if (session) attendanceFilter.session = session;
    const attendanceRecords = await Attendance.find(attendanceFilter);
    const attendedCount = attendanceRecords.filter((a) => a.attended).length;
    const noShowCount = attendanceRecords.filter((a) => a.isNoShow).length;
    const guestAttendedCount = attendanceRecords.reduce((sum, a) => sum + (a.guestAttended || 0), 0);
    const totalMealsNeeded = Object.values(sessionWise).reduce((sum, item) => sum + item.total, 0);
    const totalGuests = Object.values(sessionWise).reduce((sum, item) => sum + item.guest, 0);

    res.render('admin/reports', {
      title: 'Generate Reports',
      date: toLocalDateString(filterDate),
      session: session || '',
      sessionWise,
      mealWise,
      categoryWise,
      reservations,
      attendedCount,
      noShowCount,
      guestAttendedCount,
      totalReserved: reservations.length,
      totalGuests,
      totalMealsNeeded
    });
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/admin/dashboard');
  }
});

module.exports = router;
