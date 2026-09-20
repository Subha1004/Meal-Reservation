const SESSION_WINDOWS = {
  dinner: {
    session: 'dinner',
    label: 'Dinner',
    hours: '2:00 PM – 5:00 PM',
    startMinutes: 14 * 60,
    endMinutes: 17 * 60
  },
  breakfast: {
    session: 'breakfast',
    label: 'Breakfast',
    hours: '8:00 PM – 4:00 AM',
    startMinutes: 20 * 60,
    endMinutes: 4 * 60
  },
  lunch: {
    session: 'lunch',
    label: 'Lunch',
    hours: '8:00 AM – 1:00 PM',
    startMinutes: 8 * 60,
    endMinutes: 13 * 60
  }
};

function minutesFromMidnight(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function inWindow(minutes, startMinutes, endMinutes) {
  if (startMinutes < endMinutes) {
    return minutes >= startMinutes && minutes < endMinutes;
  }
  return minutes >= startMinutes || minutes < endMinutes;
}

function startDateOnDay(baseDate, startMinutes) {
  const start = new Date(baseDate);
  start.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
  return start;
}

function getSessionBounds(reservationDate, session) {
  const meta = getSessionMeta(session);
  if (!meta || !reservationDate) return null;
  const day = new Date(reservationDate);
  const startsAt = startDateOnDay(day, meta.startMinutes);
  const endsAt = startDateOnDay(day, meta.endMinutes);
  if (meta.startMinutes >= meta.endMinutes) {
    endsAt.setDate(endsAt.getDate() + 1);
  }
  return { startsAt, endsAt, meta };
}

function isSameLocalDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatClockTime(date) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatReservationDay(date, now) {
  if (isSameLocalDay(date, now)) return 'today';
  return date.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getMealReminder(reservations, now = new Date()) {
  const candidates = (reservations || [])
    .filter((reservation) => reservation && reservation.status === 'confirmed')
    .map((reservation) => {
      const bounds = getSessionBounds(reservation.date, reservation.session);
      if (!bounds) return null;
      return { reservation, ...bounds };
    })
    .filter(Boolean)
    .filter((candidate) => candidate.endsAt.getTime() > now.getTime())
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  const next = candidates[0];
  if (!next) return null;

  const { reservation, startsAt, endsAt, meta } = next;
  const isToday = isSameLocalDay(new Date(reservation.date), now);
  const guestCount = reservation.guestCount || 0;
  const whenLabel = formatReservationDay(new Date(reservation.date), now);

  return {
    mealName: reservation.meal ? reservation.meal.name : 'N/A',
    session: reservation.session,
    sessionLabel: meta.label,
    hours: meta.hours,
    guestCount,
    isToday,
    isCurrent: now.getTime() >= startsAt.getTime() && now.getTime() < endsAt.getTime(),
    startsAtLabel: formatClockTime(startsAt),
    dateLabel: whenLabel,
    message: `You have a ${meta.label} reservation ${isToday ? 'today' : `on ${whenLabel}`} at ${formatClockTime(startsAt)}.`
  };
}

function getCurrentMealSession(date = new Date()) {
  const minutes = minutesFromMidnight(date);
  if (inWindow(minutes, SESSION_WINDOWS.dinner.startMinutes, SESSION_WINDOWS.dinner.endMinutes)) {
    return 'dinner';
  }
  if (inWindow(minutes, SESSION_WINDOWS.breakfast.startMinutes, SESSION_WINDOWS.breakfast.endMinutes)) {
    return 'breakfast';
  }
  if (inWindow(minutes, SESSION_WINDOWS.lunch.startMinutes, SESSION_WINDOWS.lunch.endMinutes)) {
    return 'lunch';
  }
  return null;
}

function getSessionMeta(session) {
  return session ? SESSION_WINDOWS[session] : null;
}

function getNextMealSession(date = new Date()) {
  const candidates = [];
  for (let dayOffset = 0; dayOffset <= 1; dayOffset += 1) {
    const day = new Date(date);
    day.setDate(day.getDate() + dayOffset);
    ['lunch', 'dinner', 'breakfast'].forEach((session) => {
      const startsAt = startDateOnDay(day, SESSION_WINDOWS[session].startMinutes);
      if (startsAt.getTime() > date.getTime()) {
        candidates.push({ session, startsAt });
      }
    });
  }
  candidates.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  return candidates[0] || null;
}

function capitalizeSession(session) {
  const meta = getSessionMeta(session);
  return meta ? meta.label : '';
}

module.exports = {
  SESSION_WINDOWS,
  getCurrentMealSession,
  getNextMealSession,
  getSessionMeta,
  getSessionBounds,
  getMealReminder,
  capitalizeSession
};
