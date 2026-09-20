function parseLocalDate(yyyyMmDd) {
  if (yyyyMmDd && /^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) {
    const [year, month, day] = yyyyMmDd.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function toLocalDateString(date) {
  const d = date instanceof Date ? date : parseLocalDate(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dayRange(date) {
  const start = date instanceof Date ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : parseLocalDate(date);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
  return { start, end };
}

module.exports = {
  parseLocalDate,
  toLocalDateString,
  dayRange
};
