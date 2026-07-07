// ============ NATURE — real clock & local-date utilities ============
// Scheduling made time real: this module replaces the old hardcoded `TODAY`
// mock. Appointments store `startAt` as epoch ms; day-level fields stay ISO
// 'YYYY-MM-DD'. Every ms↔day conversion here goes through the LOCAL calendar
// (never `toISOString`, which buckets by UTC — a 00:30 appointment in Turkey,
// UTC+3, would land on the previous day).

export const now = () => Date.now();

const pad2 = (n) => String(n).padStart(2, '0');

// Epoch ms → local 'YYYY-MM-DD'.
export function localISODate(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export const todayISO = () => localISODate(Date.now());

// 'YYYY-MM-DD' (+ optional 'HH:mm') → local Date. Building via the numeric
// constructor keeps the interpretation local regardless of JS engine quirks
// with date-only ISO strings (which parse as UTC).
export function localDate(dateISO, hhmm = '00:00') {
  const [y, m, d] = dateISO.split('-').map(Number);
  const [h, min] = hhmm.split(':').map(Number);
  return new Date(y, m - 1, d, h || 0, min || 0, 0, 0);
}

// 'YYYY-MM-DD' + 'HH:mm' → epoch ms (local wall clock).
export const atTime = (dateISO, hhmm) => localDate(dateISO, hhmm).getTime();

export const startOfDayMs = (dateISO) => localDate(dateISO).getTime();
export const endOfDayMs = (dateISO) => localDate(dateISO).getTime() + 24 * 60 * 60 * 1000 - 1;

export function addDaysISO(dateISO, n) {
  const d = localDate(dateISO);
  d.setDate(d.getDate() + n);
  return localISODate(d.getTime());
}

// 0=Sunday … 6=Saturday (JS convention; the UI renders Monday-first).
export const weekdayOf = (dateISO) => localDate(dateISO).getDay();

export const minutesBetween = (a, b) => Math.round((b - a) / 60000);

// ---- formatting (en-GB, 24h — matches the app's existing date style) ----
export function fmtTime(ms) {
  const d = new Date(ms);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
// 'Saturday · 5 July' — Home greeting / day-agenda titles.
export function fmtDayTitle(dateISO) {
  const d = localDate(dateISO);
  const wd = d.toLocaleDateString('en-GB', { weekday: 'long' });
  const dm = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  return `${wd} · ${dm}`;
}
// 'JULY 2026' — calendar month headers.
export function fmtMonthTitle(year, month /* 0-based */) {
  const d = new Date(year, month, 1);
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }).toUpperCase();
}
