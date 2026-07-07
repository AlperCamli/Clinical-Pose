// ============ NATURE — appointment helpers (pure) ============
// Day-bucketing, conflict detection and working-hours math over the flat
// appointments array held by the store. Everything here is side-effect free;
// persistence lives in db.js, state in store.js.
import { localISODate, startOfDayMs, endOfDayMs, weekdayOf, atTime } from './clock';
import { holidayOf } from './holidays-tr';

export const APPT_STATUSES = ['booked', 'confirmed', 'checked-in', 'in-progress', 'completed', 'no-show', 'cancelled'];

// Forward transitions offered by the detail screen (cancel/no-show are shown
// as secondary actions, not part of the main flow).
export const NEXT_STATUS = {
  booked: 'confirmed',
  confirmed: 'checked-in',
  'checked-in': 'in-progress',
  'in-progress': 'completed',
};

export const STATUS_TAG = {
  booked: { variant: 'accent', label: 'Booked' },
  confirmed: { variant: 'ok', label: 'Confirmed' },
  'checked-in': { variant: 'warn', label: 'Checked in' },
  'in-progress': { variant: 'warn', label: 'In progress' },
  completed: { variant: 'ok', label: 'Completed' },
  'no-show': { variant: 'danger', label: 'No-show' },
  cancelled: { variant: 'miss', label: 'Cancelled' },
};

const active = (a) => a.status !== 'cancelled';
const endAt = (a) => a.startAt + (a.durationMin || 30) * 60000;

// Appointments on a local calendar day, time-sorted. Cancelled rows are
// excluded unless `withCancelled` (the day agenda shows them struck through).
export function apptsOn(appts, dateISO, withCancelled = false) {
  const s = startOfDayMs(dateISO);
  const e = endOfDayMs(dateISO);
  return appts
    .filter((a) => a.startAt >= s && a.startAt <= e && (withCancelled || active(a)))
    .sort((a, b) => a.startAt - b.startAt);
}

// → { 'YYYY-MM-DD': count } for the calendar density dots.
export function apptsInMonth(appts, year, month /* 0-based */) {
  const counts = {};
  for (const a of appts) {
    if (!active(a)) continue;
    const d = new Date(a.startAt);
    if (d.getFullYear() !== year || d.getMonth() !== month) continue;
    const key = localISODate(a.startAt);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

export function upcoming(appts, clientId) {
  const t = Date.now();
  return appts
    .filter((a) => active(a) && endAt(a) >= t && (!clientId || a.clientId === clientId))
    .sort((a, b) => a.startAt - b.startAt);
}

export function past(appts, clientId) {
  const t = Date.now();
  return appts
    .filter((a) => endAt(a) < t && (!clientId || a.clientId === clientId))
    .sort((a, b) => b.startAt - a.startAt);
}

// Same-practitioner interval overlap (A8). Non-blocking by design — callers
// render a warning, never prevent the save.
export function findConflicts(appts, { practitioner, startAt, durationMin, excludeId }) {
  const end = startAt + (durationMin || 30) * 60000;
  return appts.filter((a) =>
    a.id !== excludeId &&
    active(a) && a.status !== 'completed' && a.status !== 'no-show' &&
    a.practitioner === practitioner &&
    a.startAt < end && endAt(a) > startAt
  );
}

// Holiday / clinic-closed lookups for a day → { holiday?, offDay? }.
export function dayWarnings(dateISO, getSetting) {
  const out = {};
  const h = holidayOf(dateISO);
  if (h) out.holiday = h;
  const offWeekdays = getSetting('offWeekdays');
  const offDates = getSetting('offDates');
  if (offWeekdays.includes(weekdayOf(dateISO)) || offDates.includes(dateISO)) out.offDay = true;
  return out;
}

// 'HH:mm' slot chips across the clinic's working hours.
export function slotTimes(workingHours) {
  const { start, end, slotMin } = workingHours;
  const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
  const out = [];
  for (let t = toMin(start); t < toMin(end); t += slotMin || 30) {
    out.push(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`);
  }
  return out;
}

// Does a 'HH:mm' slot on a day overlap any active same-practitioner booking?
export function slotConflicts(appts, dateISO, hhmm, durationMin, practitioner, excludeId) {
  return findConflicts(appts, { practitioner, startAt: atTime(dateISO, hhmm), durationMin, excludeId }).length > 0;
}
