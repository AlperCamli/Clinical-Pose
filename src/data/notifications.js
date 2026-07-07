// ============ NATURE — local notifications (expo-notifications) ============
// Fully on-device reminders — no backend, matching the offline-first design.
// The module is defensively required (postCapture.js pattern) so Expo Go /
// simulators without the native module degrade to no-ops; callers can check
// NOTIFICATIONS_AVAILABLE to toast "needs a dev build" instead of failing.
//
// Notification `data.type` values → routed by App.js:
//   'appt'          → appointment detail        { aptId }
//   'send-reminder' → detail + send sheet open  { aptId }
//   'day'           → today's agenda
//   'post'          → post detail               { cid, caseId, postId }
import { Platform } from 'react-native';
import { TREATMENTS } from './treatments';
import { fmtTime, localISODate } from './clock';

let N = null;
try {
  N = require('expo-notifications');
} catch {
  N = null;
}

export const NOTIFICATIONS_AVAILABLE = !!N;

// Reminders are only useful for bookings that haven't happened yet.
const REMINDABLE = new Set(['booked', 'confirmed']);
// Keep well under the iOS ~64 pending-notification cap: only schedule for
// appointments starting inside this window; the boot reconcile tops it up.
const HORIZON_MS = 30 * 24 * 60 * 60 * 1000;

const CHANNEL = 'appointments';

export function configureNotifications() {
  if (!N) return;
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    N.setNotificationChannelAsync(CHANNEL, {
      name: 'Appointments',
      importance: N.AndroidImportance.HIGH,
    }).catch(() => {});
  }
}

// Lazy permission — first booking asks, later calls reuse the answer
// (mirrors the camera/media-library permission pattern).
let permPromise;
export async function ensureNotifPermission() {
  if (!N) return false;
  try {
    const current = await N.getPermissionsAsync();
    if (current?.granted) return true;
    if (!permPromise) permPromise = N.requestPermissionsAsync();
    const res = await permPromise;
    return !!res?.granted;
  } catch {
    return false;
  }
}

async function hasPermission() {
  if (!N) return false;
  try {
    return !!(await N.getPermissionsAsync())?.granted;
  } catch {
    return false;
  }
}

const dateTrigger = (ms) => ({
  type: N.SchedulableTriggerInputTypes.DATE,
  date: new Date(ms),
  channelId: Platform.OS === 'android' ? CHANNEL : undefined,
});

const treatmentName = (tid) => TREATMENTS[tid]?.name || 'Session';

// Schedule the doctor-facing reminders for one appointment: one per lead time
// plus a single "send the client a reminder" prompt 24h out (when the client
// has a phone number). Returns the scheduled notification ids — the caller
// persists them on the row so edits/cancellations can clean up.
export async function scheduleAppointmentReminders(appt, client) {
  if (!N || !REMINDABLE.has(appt.status)) return [];
  if (!(await ensureNotifPermission())) return [];
  const ids = [];
  const nowMs = Date.now();
  const when = appt.startAt;
  if (when <= nowMs || when - nowMs > HORIZON_MS) return [];

  const leadLabel = (mins) =>
    mins >= 1440 ? (mins === 1440 ? 'tomorrow' : `in ${Math.round(mins / 1440)} days`)
      : mins >= 60 ? `in ${Math.round(mins / 60)} hour${mins >= 120 ? 's' : ''}` : `in ${mins} min`;

  for (const lead of appt.reminderLeadMins || []) {
    const fireAt = when - lead * 60000;
    if (fireAt <= nowMs) continue;
    try {
      const id = await N.scheduleNotificationAsync({
        content: {
          title: 'Upcoming appointment',
          body: `${client?.name || 'Client'} — ${treatmentName(appt.treatment)} ${leadLabel(lead)} at ${fmtTime(when)}`,
          data: { type: 'appt', aptId: appt.id },
        },
        trigger: dateTrigger(fireAt),
      });
      ids.push(id);
    } catch {
      // scheduling one reminder failing shouldn't sink the rest
    }
  }

  const promptAt = when - 24 * 60 * 60 * 1000;
  if (client?.phone && promptAt > nowMs) {
    try {
      const id = await N.scheduleNotificationAsync({
        content: {
          title: `Send a reminder to ${client.name}?`,
          body: `Tomorrow at ${fmtTime(when)} — ${treatmentName(appt.treatment)}. Tap to send via WhatsApp/SMS.`,
          data: { type: 'send-reminder', aptId: appt.id },
        },
        trigger: dateTrigger(promptAt),
      });
      ids.push(id);
    } catch { /* ignore */ }
  }
  return ids;
}

export async function cancelReminders(ids) {
  if (!N || !ids?.length) return;
  for (const id of ids) {
    try { await N.cancelScheduledNotificationAsync(id); } catch { /* already gone */ }
  }
}

// Edit path: drop the old set, schedule against the new time/leads.
export async function rescheduleAppointmentReminders(appt, client, oldIds) {
  await cancelReminders(oldIds);
  return scheduleAppointmentReminders(appt, client);
}

// ---- daily agenda summary (repeating; content is static by nature of local
// scheduling — it deep-links to today's agenda rather than embedding it) ----
export async function scheduleDailySummary(hhmm) {
  if (!N) return null;
  if (!(await ensureNotifPermission())) return null;
  const [hour, minute] = hhmm.split(':').map(Number);
  try {
    return await N.scheduleNotificationAsync({
      content: {
        title: 'Today at the clinic',
        body: 'Review today\'s appointments and follow-ups.',
        data: { type: 'day' },
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.DAILY,
        hour, minute,
        channelId: Platform.OS === 'android' ? CHANNEL : undefined,
      },
    });
  } catch {
    return null;
  }
}

export async function cancelScheduled(id) {
  if (!N || !id) return;
  try { await N.cancelScheduledNotificationAsync(id); } catch { /* already gone */ }
}

// ---- social: "remind me to post" (E2) ----
export async function schedulePostReminder({ cid, caseId, postId }, whenMs) {
  if (!N || whenMs <= Date.now()) return null;
  if (!(await ensureNotifPermission())) return null;
  try {
    return await N.scheduleNotificationAsync({
      content: {
        title: 'Time to post',
        body: 'Your before/after post is ready to share.',
        data: { type: 'post', cid, caseId, postId },
      },
      trigger: dateTrigger(whenMs),
    });
  } catch {
    return null;
  }
}

// ---- boot reconcile ----
// Local notifications drift from the DB when the app is killed mid-write or a
// row is edited without its schedule finishing. On boot: cancel orphans whose
// appointment is gone/past/cancelled, and (re)schedule rows inside the horizon
// whose ids are missing. Returns { aptId: ids } patches for the store to persist.
export async function reconcileNotifications(appts, findClient) {
  if (!N || !(await hasPermission())) return {};
  let scheduled;
  try {
    scheduled = await N.getAllScheduledNotificationsAsync();
  } catch {
    return {};
  }
  const nowMs = Date.now();
  const apptById = new Map(appts.map((a) => [a.id, a]));
  const liveIds = new Set();

  for (const req of scheduled) {
    const data = req?.content?.data;
    if (!data || (data.type !== 'appt' && data.type !== 'send-reminder')) continue;
    const appt = apptById.get(data.aptId);
    const stale = !appt || !REMINDABLE.has(appt.status) || appt.startAt <= nowMs;
    if (stale) {
      try { await N.cancelScheduledNotificationAsync(req.identifier); } catch { /* ignore */ }
    } else {
      liveIds.add(req.identifier);
    }
  }

  const patches = {};
  for (const appt of appts) {
    if (!REMINDABLE.has(appt.status)) continue;
    if (appt.startAt <= nowMs || appt.startAt - nowMs > HORIZON_MS) continue;
    const known = appt.notificationIds || [];
    const allAlive = known.length > 0 && known.every((id) => liveIds.has(id));
    if (allAlive) continue;
    await cancelReminders(known.filter((id) => liveIds.has(id)));
    patches[appt.id] = await scheduleAppointmentReminders(appt, findClient(appt.clientId));
  }
  return patches;
}

// ---- response plumbing (App.js owns the actual navigation) ----
export function addResponseListener(cb) {
  if (!N) return { remove: () => {} };
  return N.addNotificationResponseReceivedListener((response) => {
    const data = response?.notification?.request?.content?.data;
    if (data?.type) cb(data);
  });
}

export async function getInitialResponse() {
  if (!N) return null;
  try {
    const response = await N.getLastNotificationResponseAsync();
    return response?.notification?.request?.content?.data || null;
  } catch {
    return null;
  }
}

export const todayISOForRoute = () => localISODate(Date.now());
