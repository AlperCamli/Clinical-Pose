// ============ NATURE — persisted-settings defaults ============
// Fallback values for the `settings` KV table (src/data/db.js). Reads go
// through `store.getSetting(key)` which falls back here, so a fresh install
// needs no seeding — only changed values are ever written.

export const SETTINGS_DEFAULTS = {
  // scheduling
  workingHours: { start: '09:00', end: '19:00', slotMin: 30 },
  offWeekdays: [0],            // 0=Sunday … 6=Saturday — weekly closed days
  offDates: [],                // ad-hoc closed dates, ISO 'YYYY-MM-DD'
  reminderDefaults: [1440, 60], // minutes before startAt (1 day, 1 hour)
  dailySummary: { enabled: false, time: '08:30', notifId: null },
  // clinic identity (used in message templates)
  clinicName: 'Nature Clinic',
  doctorName: 'Dr. Demir',
  practitioners: ['Dr. Demir', 'Dr. Aydın'],
  // capture defaults (migrates the previously dead Settings switch)
  eyesHiddenDefault: true,
  // per-treatment message-template overrides live under dynamic keys: 'tpl:<tid>'
};
