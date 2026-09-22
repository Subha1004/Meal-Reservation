(function (root) {
  var SESSION_WINDOWS = {
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
    var start = new Date(baseDate);
    start.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
    return start;
  }

  function getCurrentMealSession(date) {
    date = date || new Date();
    var minutes = minutesFromMidnight(date);
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

  function getNextMealSession(date) {
    date = date || new Date();
    var candidates = [];
    for (var dayOffset = 0; dayOffset <= 1; dayOffset += 1) {
      var day = new Date(date);
      day.setDate(day.getDate() + dayOffset);
      ['lunch', 'dinner', 'breakfast'].forEach(function (session) {
        var startsAt = startDateOnDay(day, SESSION_WINDOWS[session].startMinutes);
        if (startsAt.getTime() > date.getTime()) {
          candidates.push({ session: session, startsAt: startsAt });
        }
      });
    }
    candidates.sort(function (a, b) {
      return a.startsAt.getTime() - b.startsAt.getTime();
    });
    return candidates[0] || null;
  }

  function formatClock(date) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
  }

  function formatNextStart(date) {
    return date.toLocaleString([], {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function applyMealCards(session) {
    var cards = document.querySelectorAll('[data-meal-session]');
    var visibleCount = 0;
    cards.forEach(function (card) {
      var match = session && card.getAttribute('data-meal-session') === session;
      card.classList.toggle('d-none', !match);
      if (match) visibleCount += 1;
    });
    return visibleCount;
  }

  function updateBanner(now) {
    var banner = document.getElementById('current-meal-banner');
    if (!banner) return getCurrentMealSession(now);

    var clockEl = document.getElementById('live-meal-clock');
    var titleEl = document.getElementById('current-meal-title');
    var hoursEl = document.getElementById('current-meal-hours');
    var emptyEl = document.getElementById('current-meal-empty');
    var gridEl = document.getElementById('current-meal-grid');
    var noItemsEl = document.getElementById('current-meal-no-items');

    if (clockEl) clockEl.textContent = formatClock(now);

    var session = getCurrentMealSession(now);
    var next = getNextMealSession(now);
    var meta = getSessionMeta(session);

    banner.classList.remove('banner-session-breakfast', 'banner-session-lunch', 'banner-session-dinner');
    if (session) banner.classList.add('banner-session-' + session);

    if (session && meta) {
      if (titleEl) titleEl.textContent = 'Now serving: ' + meta.label;
      if (hoursEl) hoursEl.textContent = meta.hours;
      if (emptyEl) emptyEl.classList.add('d-none');
      var visibleCount = applyMealCards(session);
      if (gridEl) gridEl.classList.toggle('d-none', visibleCount === 0);
      if (noItemsEl) {
        noItemsEl.classList.toggle('d-none', visibleCount > 0);
        noItemsEl.textContent = 'No ' + meta.label.toLowerCase() + ' items are available right now.';
      }
    } else {
      applyMealCards(null);
      if (gridEl) gridEl.classList.add('d-none');
      if (noItemsEl) noItemsEl.classList.add('d-none');
      if (emptyEl) {
        emptyEl.classList.remove('d-none');
        var nextLabel = next ? getSessionMeta(next.session).label : '';
        var nextTime = next ? formatNextStart(next.startsAt) : '';
        titleEl.textContent = 'No meal session is open';
        hoursEl.textContent = next ? 'Next: ' + nextLabel + ' at ' + nextTime : '';
        emptyEl.innerHTML =
          'Nothing is being served at this time.' +
          (next ? ' Next up is <strong>' + nextLabel + '</strong> at ' + nextTime + '.' : '');
      }
    }

    var pendingGrid = document.getElementById('current-meal-grid');
    if (pendingGrid) pendingGrid.classList.remove('meal-grid-pending');

    return session;
  }

  function updateDashboardHint(now) {
    var hint = document.getElementById('dashboard-meal-session');
    if (!hint) return;
    var session = getCurrentMealSession(now);
    var next = getNextMealSession(now);
    if (session) {
      var meta = getSessionMeta(session);
      hint.textContent = 'Now serving: ' + meta.label;
    } else if (next) {
      var nextMeta = getSessionMeta(next.session);
      hint.textContent = 'Next: ' + nextMeta.label + ' at ' + formatNextStart(next.startsAt);
    } else {
      hint.textContent = 'No meal session is open';
    }
  }

  function tick() {
    var now = new Date();
    updateBanner(now);
    updateDashboardHint(now);
  }

  root.MealSessions = {
    getCurrentMealSession: getCurrentMealSession,
    getNextMealSession: getNextMealSession,
    getSessionMeta: getSessionMeta
  };

  document.addEventListener('DOMContentLoaded', function () {
    tick();
    setInterval(tick, 1000);
  });
})(window);
