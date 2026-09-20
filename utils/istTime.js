const TIME_ZONE = 'Asia/Kolkata';

function getZonedParts(date = new Date(), timeZone = TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    weekday: 'long'
  }).formatToParts(date);

  const map = {};
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour) % 24,
    minute: Number(map.minute),
    second: Number(map.second),
    weekday: map.weekday
  };
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function toDateKey(parts) {
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

function getTodayDateKeyIST(date = new Date()) {
  return toDateKey(getZonedParts(date));
}

function addDaysToParts(parts, days) {
  const utc = Date.UTC(parts.year, parts.month - 1, parts.day + days);
  const shifted = new Date(utc);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate()
  };
}

function formatDateLabelIST(parts) {
  const utc = Date.UTC(parts.year, parts.month - 1, parts.day, 6, 0, 0);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(utc);
}

function formatMinutesClock(totalMinutes) {
  const minutesInDay = 24 * 60;
  const minutes = ((totalMinutes % minutesInDay) + minutesInDay) % minutesInDay;
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${pad2(minute)} ${period}`;
}

module.exports = {
  TIME_ZONE,
  getZonedParts,
  toDateKey,
  getTodayDateKeyIST,
  addDaysToParts,
  formatDateLabelIST,
  formatMinutesClock
};
