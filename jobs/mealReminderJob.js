const cron = require('node-cron');
const User = require('../models/User');
const Reservation = require('../models/Reservation');
const MealReminderLog = require('../models/MealReminderLog');
const { SESSION_WINDOWS } = require('../utils/mealSessions');
const { parseLocalDate, dayRange } = require('../utils/dates');
const { sendMail, getTransporter } = require('../utils/mailer');
const {
  TIME_ZONE,
  getZonedParts,
  toDateKey,
  addDaysToParts,
  formatDateLabelIST,
  formatMinutesClock
} = require('../utils/istTime');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_PATTERN.test(email.trim());
}

function getLeadMinutes() {
  const parsed = Number(process.env.REMINDER_LEAD_MINUTES);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 30;
}

function getActiveReminderWindows(now = new Date()) {
  const parts = getZonedParts(now);
  const minutes = parts.hour * 60 + parts.minute;
  const lead = getLeadMinutes();
  const windows = [];

  Object.values(SESSION_WINDOWS).forEach((meta) => {
    const overnight = meta.startMinutes >= meta.endMinutes;
    const reminderStart = meta.startMinutes - lead;
    let inWindow = false;
    let dateParts = { year: parts.year, month: parts.month, day: parts.day };

    if (!overnight) {
      inWindow = minutes >= reminderStart && minutes < meta.endMinutes;
    } else if (minutes >= reminderStart || minutes < meta.endMinutes) {
      inWindow = true;
      if (minutes < meta.endMinutes) {
        dateParts = addDaysToParts(parts, -1);
      }
    }

    if (inWindow) {
      windows.push({
        session: meta.session,
        label: meta.label,
        hours: meta.hours,
        dateKey: toDateKey(dateParts),
        dateLabel: formatDateLabelIST(dateParts),
        bookingCloses: formatMinutesClock(meta.endMinutes)
      });
    }
  });

  return windows;
}

function buildEmail(studentName, window) {
  const subject = `Meal Reservation Reminder - ${window.label}`;
  const text = [
    `Hi ${studentName},`,
    '',
    `This is a reminder for today's ${window.label}.`,
    '',
    `Meal: ${window.label}`,
    `Date: ${window.dateLabel}`,
    `Meal timing: ${window.hours}`,
    `Booking closes: ${window.bookingCloses}`,
    '',
    'Please login to the Meal Reservation application and complete your reservation before the booking deadline.',
    '',
    'Thank you,',
    'Meal Reservation'
  ].join('\n');

  const html = `
    <p>Hi ${studentName},</p>
    <p>This is a reminder for today's <strong>${window.label}</strong>.</p>
    <p>
      <strong>Meal:</strong> ${window.label}<br>
      <strong>Date:</strong> ${window.dateLabel}<br>
      <strong>Meal timing:</strong> ${window.hours}<br>
      <strong>Booking closes:</strong> ${window.bookingCloses}
    </p>
    <p>Please login to the Meal Reservation application and complete your reservation before the booking deadline.</p>
    <p>Thank you,<br>Meal Reservation</p>
  `;

  return { subject, text, html };
}

async function hasExistingReservation(studentId, session, dateKey) {
  const { start, end } = dayRange(parseLocalDate(dateKey));
  return Reservation.exists({
    student: studentId,
    session,
    date: { $gte: start, $lt: end },
    status: { $in: ['confirmed', 'cancelled', 'completed'] }
  });
}

async function claimReminder(studentId, session, dateKey) {
  try {
    await MealReminderLog.create({ student: studentId, session, dateKey });
    return true;
  } catch (error) {
    if (error && error.code === 11000) return false;
    throw error;
  }
}

async function sendUpcomingMealReminders() {
  try {
    if (!getTransporter()) {
  console.log('REMINDER DEBUG: Email transporter is NOT configured');
  return;
}

console.log('REMINDER DEBUG: Email transporter is configured');

const windows = getActiveReminderWindows();
console.log('REMINDER DEBUG: Active windows:', windows);

if (!windows.length) {
  console.log('REMINDER DEBUG: No active reminder window');
  return;
}

    const students = await User.find({
      role: 'student',
      email: { $exists: true, $nin: [null, ''] }
    }).select('name email');

    for (const window of windows) {
      for (const student of students) {
        try {
          if (!isValidEmail(student.email)) continue;
          if (await hasExistingReservation(student._id, window.session, window.dateKey)) continue;
          const claimed = await claimReminder(student._id, window.session, window.dateKey);
          if (!claimed) continue;

          try {
            const { subject, text, html } = buildEmail(student.name, window);
            await sendMail({ to: student.email, subject, text, html });
          } catch (sendError) {
            await MealReminderLog.deleteOne({
              student: student._id,
              session: window.session,
              dateKey: window.dateKey
            });
            console.error(
              `Meal reminder email failed for ${student.email} (${window.session} ${window.dateKey}):`,
              sendError.message
            );
          }
        } catch (studentError) {
          console.error('Meal reminder skipped a student:', studentError.message);
        }
      }
    }
  } catch (error) {
    console.error('Meal reminder job error:', error.message);
  }
}

function startMealReminderScheduler() {
  try {
    cron.schedule(
      '* * * * *',
      () => {
        sendUpcomingMealReminders();
      },
      { timezone: TIME_ZONE }
    );

    setTimeout(() => {
      sendUpcomingMealReminders();
    }, 5000);

    console.log(`Meal reminder scheduler started (${TIME_ZONE})`);
  } catch (error) {
    console.error('Meal reminder scheduler failed to start:', error.message);
  }
}

module.exports = {
  startMealReminderScheduler,
  sendUpcomingMealReminders,
  getActiveReminderWindows
};
