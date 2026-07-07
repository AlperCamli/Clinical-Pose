# Nature — Scheduling, Reminders, Messaging, Video & TV (implementation notes)

This documents the feature update that implemented the selected slice of
[`future-plans.md`](./future-plans.md): appointments + calendar (Cat A), local
notifications + client WhatsApp/SMS reminders (Cat B), treatment texts + result
documentation (Cat C core), overlay/video capture upgrades (Cat D), social
polish (Cat E), and tablet/smart-TV presentation (Cat I subset).

## Time became real

- The hardcoded `TODAY` mock is gone. `src/data/clock.js` is the only place
  ms↔day conversion happens, and it always uses the **local** calendar (never
  `toISOString()` — Turkey is UTC+3; a UTC slice would bucket evening/early
  appointments onto the wrong day).
- Appointments store `startAt` as **epoch ms**; sessions/cases keep their ISO
  `YYYY-MM-DD` day fields.
- Seed data (`src/data/seed.js`) now derives its dates as offsets from the
  install day, so a fresh install always demos current-looking data.

## Data (DB v6, `src/data/db.js`)

New tables (all follow the `serverId / updatedAt / dirty` sync convention):

- **`appointments`** — `clientId, caseId?, practitioner, treatment?, startAt,
  durationMin, status, notes, reminderLeadMins (JSON), notificationIds (JSON),
  reminderSentAt?, sessionId?`. Status lifecycle:
  `booked → confirmed → checked-in → in-progress → completed`, plus `no-show`
  and `cancelled` (soft — rows are kept, calendar excludes them).
- **`settings`** — KV with JSON values; first persisted settings in the app.
  Defaults live in `src/data/settingsDefaults.js` and are read through
  `store.getSetting(key)` (only changed keys are ever written). Keys:
  `workingHours, offWeekdays, offDates, reminderDefaults, dailySummary,
  clinicName, doctorName, practitioners, eyesHiddenDefault, tpl:<treatmentId>`.
- **`videos`** — clinical clips attached to a **session** (a guided turn covers
  several angles). Files live under `documentDirectory/videos/<client>/<case>/
  <session>/<ts>.mp4` (`src/data/videos.js`, mirroring `photos.js`), with a
  best-effort gallery mirror and boot-time uri recovery.
- `posts` gained `scheduledAt / scheduledNotifId` (remind-me-to-post).

Pure helpers: `src/data/appointments.js` (day bucketing, month density counts,
same-practitioner overlap detection — **non-blocking by design** — off-day and
holiday warnings, working-hour slot generation).

## Calendar UI

- `CalendarScreen` — vertically-scrolling months (−12…+24), the app's first
  `FlatList` (fixed-height month blocks → `getItemLayout` → instant "Today"
  jump). Density dots per day; Turkish holidays tinted warn, clinic off-days
  tinted gray. On ≥768 dp the selected day's agenda docks as a second pane.
- `MonthGrid` is the shared primitive (calendar, booking date picker,
  Settings closed-dates picker).
- `DayAgendaScreen` / `DayAgenda` — week strip, holiday/off-day banner,
  appointment cards.
- `AppointmentSetupScreen` — booking form modeled on CaseSetupScreen; the date
  picker is our own MonthGrid-in-a-Sheet and time is working-hours slot chips
  (busy slots tinted but selectable) — **no native datetimepicker dependency**.
- `AppointmentDetailScreen` — lifecycle chips, send-reminder sheet, shot-list
  preview (D1), and **Start capture** (A6): a booking with a linked case gets a
  follow-up session, otherwise a new case + baseline session is created; the
  appointment is stamped `in-progress`, `aptId` threads through the capture
  params, and SessionReview's save marks it `completed` and links `sessionId`.

## Turkish holidays

`src/data/holidays-tr.js` — static offline dataset 2026–2030: generated fixed
national holidays + explicit Diyanet dates for Ramazan/Kurban Bayramı, with
`half: true` Arefe days. **2029–2030 religious dates are projections — reconfirm
against the official calendar nearer the time.**

## Notifications (`src/data/notifications.js`)

- `expo-notifications`, guarded require (Expo Go → no-ops + toasts).
- Per appointment: one local notification per reminder lead (default 1 day +
  1 hour) **plus** a "Send a reminder to {client}?" prompt at −24 h when the
  client has a phone number.
- Permission is requested lazily at the first booking.
- Edits cancel-then-reschedule; ids are persisted on the row only after
  scheduling succeeds. Cancel/no-show/complete clears pending reminders.
- Boot reconcile (`reconcileNotifications`) cancels orphans and re-schedules
  missing reminders within a **30-day horizon** (stays well under the iOS ~64
  pending cap).
- Notification taps deep-link via `navigationRef` (`App.js`): `appt` /
  `send-reminder` → appointment detail (the latter auto-opens the send sheet),
  `day` → today's agenda, `post` → post detail. The container only mounts after
  hydration, so cold-start routing always resolves.
- Daily agenda summary = repeating local notification with static copy (no
  backend to compose fresh content); it deep-links to today.

## Client messaging (no backend — deliberate)

`src/data/messages.js` + `SendReminderSheet`: messages open the doctor's own
WhatsApp (`whatsapp://send`, `https://wa.me` fallback) or SMS composer
(platform-correct `body` separator) pre-filled — nothing sends automatically,
no provider costs, works offline-first. Phone numbers normalize to E.164
(+90…). Templates are **Turkish defaults** per treatment
(`treatments.js: msg {reminder, preCare, afterCare, resultText, caption}` +
`description`, `nameTr`), rendered with `{client} {clinic} {doctor} {treatment}
{date} {time}` tokens and editable per clinic in Settings → Message templates
(overrides in settings `tpl:<tid>`; resetting deletes the override).

**Send results** (`SendResultsScreen`, from Timeline/Compare): redacted
before/after composite (PostPreview split → view-shot snapshot) + result text +
treatment description. Two-step UX by necessity: deep links cannot carry an
image and text together — text goes via deep link, the image via the share
sheet. Sending a client their own photos requires no social consent.

## Capture

- **Overlay cover fix** (`GuideOverlay.js`): guides now scale the 1000×1400
  design box to **cover** the measured viewport (same crop as the preview)
  instead of letterboxing — the guide finally matches the captured photo's
  framing. Optional per-overlay `cal {scale, dx, dy}` calibration is supported
  in `overlayShapes.js` defs and mirrored in `scripts/render-overlays.mjs`.
- Photos capture at `quality: 1`.
- **Guided video** (`VideoCaptureScreen`): `CameraView mode="video"` at 1080p,
  auto-advancing per-angle prompts + live overlay (on-screen only — the saved
  clip is clean), 60 s cap, mic permission handled. Playback via `expo-video`
  (`VideoPlayerScreen`); entries from AngleChecklist and SessionReview.
  **Limitation:** videos are clinical documentation only — no redaction-on-video
  and no social/video export in this release.

## Social polish

Story mode pins 9:16. Carousel sharing is honest: iOS presents the share sheet
per slide sequentially; Android shares slide 1 and relies on save-to-gallery
(`sharePostSet` in `posts.js`). "Remind me to post" schedules a local
notification and stamps `scheduledAt` (Scheduled tag on Home/history; sharing
clears it). "Caption" copies the treatment's caption template.

## Presentation mode (smart TV)

`PresentationScreen` — patient-safe consult-room slideshow designed for OS
screen mirroring (AirPlay / Google Home / Miracast; **no casting SDK**):
landscape lock, keep-awake, black background, auto-advancing before/after
slides with fading controls. Privacy is hard-coded: **redaction always forced,
no client name/code rendered**. Native Chromecast (react-native-google-cast)
is a possible future enhancement. Entries: Compare top bar, Timeline actions.

Phones lock to portrait at boot; tablets stay rotatable (two-pane calendar +
presentation). `app.json` orientation is `default` for that reason.

## Dev notes

- New deps: `expo-notifications`, `expo-video`, `expo-keep-awake`,
  `expo-clipboard`, `expo-screen-orientation` → **dev-client rebuild required**.
  Everything degrades to toasts in Expo Go (guarded requires, `postCapture.js`
  pattern).
- iOS `NSMicrophoneUsageDescription` + `LSApplicationQueriesSchemes: [whatsapp]`
  added; expo-camera plugin gained `microphonePermission`.
- v5 → v6 migration is additive (new tables + a gated `posts` ALTER batch);
  existing installs keep their data and receive the demo appointments once.
