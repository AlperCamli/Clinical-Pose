# Nature — Future Plans & Feature Backlog

A living backlog of **ideas we may want to build next**, with a focus on the doctor's day-to-day
*planning* life — a **schedule view** for sessions and reservations, plus **reminders/notifications**
before an appointment — layered on top of what Nature already does well (before/after posing helpers,
clinical archive, and social-media content creation).

> **Nothing in this document is implemented.** It is a planning artifact: ideas, a rough priority and
> category breakdown, a sketch of *how* each could be built, and brief pros/cons. Treat it as a menu to
> pick from, not a commitment.

> **Status legend**
> - 🔵 **Proposed** — an idea on the table, not yet decided.
> - ⭐ **Recommended next** — high value / good effort ratio; suggested for the next milestone.
> - 🧩 **Depends on** — needs another item (or Phase 2 backend) first.

> **Priority scale**
> - **P0** — Core of this initiative (scheduling + reminders). Build first.
> - **P1** — High value, near-term; strong fit with the current app.
> - **P2** — Medium; valuable once P0/P1 land or once the backend (Phase 2) exists.
> - **P3** — Ambitious / long-horizon; revisit later.

---

## 0. Where we are today (context for the ideas below)

- **Domain:** `Client → Case → Session → Photo`. A *session* is a **capture event** created when the
  doctor starts shooting — there is **no notion of a future, booked appointment**.
- **Storage:** offline-first SQLite ([`src/data/db.js`](../src/data/db.js)); every row already carries
  `serverId` / `updatedAt` / `dirty`, so new tables can sync in Phase 2 with no migration pain.
- **Navigation:** a single native-stack ([`src/navigation.js`](../src/navigation.js)); there is **no tab
  bar** — adding a top-level "Schedule" destination is a navigation decision (see §1.3).
- **No notifications, no calendar.** `expo-notifications` and `expo-calendar` are **not yet installed**.
- **Practitioners** (Dr. Demir, Dr. Aydın) exist only as **text labels** — there is no auth, no real
  multi-user, and no per-doctor data partitioning yet.
- **Time is mocked:** `TODAY` is hardcoded in [`src/data/helpers.js`](../src/data/helpers.js); real
  scheduling needs a live clock and timezone handling.

These five facts shape almost every idea below.

---

# CATEGORY A — Scheduling & Reservations  ·  **(P0, the headline initiative)**

The goal: let a doctor **see and control upcoming sessions/reservations** and turn a booking directly
into a capture session, closing the loop with the posing flow that already exists.

### A1. `appointment` data model  ⭐ 🧩
A new SQLite table is the foundation for everything else in this category.

- **How:** add an `appointments` table to [`db.js`](../src/data/db.js) — `id, serverId, clientId,
  caseId (nullable), practitioner, treatment, startAt (epoch), durationMin, status, room/resource,
  notes, reminderLeadMins (JSON), createdAt, updatedAt, dirty`. Add `upsertAppointment` / `loadAppointments`
  and a store method (`addAppointment`, `updateAppointment`) mirroring the existing `addSession` pattern.
  Bump `DB_VERSION` and add a `CREATE TABLE IF NOT EXISTS` (additive — no destructive migration).
- **Pros:** unlocks all other scheduling features; reuses the proven upsert/dirty/sync pattern; an
  appointment can later *become* a session, linking planning to capture.
- **Cons:** first piece of "future-dated" data in the app — forces real date/time + timezone handling;
  appointment↔session↔case relationships need careful lifecycle rules.

### A2. Schedule view — Agenda (list) layout  ⭐
The fastest path to value: a scrollable, date-grouped list of upcoming reservations.

- **How:** new `ScheduleScreen.js` rendering appointments grouped by day ("Today / Tomorrow / this week"),
  each row showing time, client avatar+initials, treatment tag, status. Reuse `Card`, `Avatar`, `Tag`,
  `SecLabel` from [`ui.js`](../src/components/ui.js). Tap → appointment detail (A5).
- **Pros:** reuses existing components/visual language; cheap to build; mobile-friendly; covers 80% of
  "what's next?" needs.
- **Cons:** weaker for "how busy is Thursday afternoon?" spatial questions than a calendar grid.

### A3. Schedule view — Day / Week calendar grid  🔵
A time-grid calendar (hours down the side, appointments as blocks).

- **How:** custom grid with absolutely-positioned blocks (top = start, height = duration), or adopt a
  library (e.g. `react-native-calendars` agenda, or a timeline component). A horizontal day-strip for
  navigation. Could share the data layer with A2.
- **Pros:** best for spotting gaps/overlaps and double-bookings; familiar "calendar" mental model.
- **Cons:** significantly more layout work (overlapping events, all-day, scroll-to-now); a library adds a
  dependency and styling friction with the current bespoke design system.

### A4. Month overview + density dots  🔵
A month grid where each day shows a count/dots of bookings; tap a day → that day's agenda (A2).

- **How:** lightweight calendar matrix component; precompute per-day counts from the appointments list.
- **Pros:** great for long-range planning and seeing busy/quiet weeks at a glance.
- **Cons:** redundant with A2/A3 if those exist; limited screen real estate for detail on phones.

### A5. Create / edit reservation flow  ⭐
Booking form: pick client (or create), treatment, practitioner, date, time, duration, room, notes.

- **How:** new `AppointmentSetupScreen.js` modeled on [`SessionSetupScreen.js`](../src/screens/SessionSetupScreen.js)
  and [`CaseSetupScreen.js`](../src/screens/CaseSetupScreen.js). Reuse the client-search flow to attach a
  client; reuse `TREATMENTS` for the treatment chips. Needs a real **date+time picker**
  (`@react-native-community/datetimepicker` or an Expo-compatible equivalent).
- **Pros:** completes the loop; reuses treatment/client primitives already in the app.
- **Cons:** introduces a date-time picker dependency; conflict-checking (A8) is a separate concern.

### A6. Appointment → Session handoff (the loop-closer)  ⭐ 🧩
From an appointment's detail, **"Start capture"** creates the `case`/`session` and jumps straight into
the existing angle-checklist → camera flow.

- **How:** on the appointment detail screen, a primary button calls `addCase`/`addSession` (if needed)
  and `nav.replace('angleChecklist', …)`. Stamp the appointment `status = completed` and link
  `sessionId` back onto the appointment row.
- **Pros:** this is the *whole point* — planning flows seamlessly into Nature's core posing workflow; no
  re-entering client/treatment.
- **Cons:** needs clear rules for "appointment with no case yet" vs "follow-up on an existing case".

### A7. Appointment status lifecycle  ⭐
States: `booked → confirmed → checked-in → in-progress → completed`, plus `no-show` and `cancelled`.

- **How:** a `status` enum on the appointment row; status chips + quick actions (swipe or buttons) on the
  agenda/detail. Color-code with existing `StatusTag`/`Tag` variants.
- **Pros:** turns the schedule into an operational tool (front-desk + doctor); feeds analytics (no-show
  rate, utilization).
- **Cons:** more UI states to design; "who can change status" matters once multi-user lands.

### A8. Conflict / double-booking detection  🔵
Warn when a new/edited appointment overlaps another for the same practitioner or room.

- **How:** on save, query appointments for the same practitioner/room in the time window; show an inline
  warning (non-blocking by default).
- **Pros:** prevents real scheduling mistakes; cheap once A1 exists.
- **Cons:** "room/resource" model must exist; timezone/duration edge-cases.

### A9. Recurring & auto-suggested follow-ups  ⭐ 🧩
When a "before" session is captured, **suggest booking the matching follow-up** ("After 2 weeks", "After
1 month") — pre-filled from the treatment's `AFTER_LABELS`.

- **How:** after a capture session saves, offer "Schedule follow-up" with a suggested date (today +
  protocol interval). Optionally store per-treatment recommended follow-up intervals in
  [`treatments.js`](../src/data/treatments.js).
- **Pros:** directly grows the schedule from the existing capture flow; clinically meaningful (consistent
  follow-up timing improves before/after comparability); great retention driver for the clinic.
- **Cons:** needs per-treatment interval data; recurrence rules can get complex if generalized.

### A10. Waitlist & quick-fill cancellations  🔵 🧩
A waitlist of clients wanting earlier slots; when a cancellation frees a slot, surface candidates.

- **How:** a `waitlist` flag/table; on cancel, match by treatment/practitioner and prompt to notify.
- **Pros:** real revenue impact (fills gaps).
- **Cons:** most valuable with client-facing messaging (Category B); more process than the MVP needs.

### A11. Multi-practitioner / resource view  🔵 🧩
Side-by-side columns per practitioner (or room) for a given day.

- **How:** extend the day grid (A3) to lanes keyed by practitioner/room.
- **Pros:** essential for multi-doctor clinics; pairs with conflict detection.
- **Cons:** depends on real multi-user (Category G) to be meaningful; dense UI on phone — better on tablet.

---

# CATEGORY B — Notifications & Reminders  ·  **(P0 for self-reminders, P1+ for client-facing)**

Make the app **proactively** nudge the doctor (and optionally the client) so reservations aren't missed
and follow-up photos happen on time.

### B1. Local notifications before an appointment  ⭐
Schedule on-device reminders (e.g. 1 day and 1 hour before) for each booking.

- **How:** add `expo-notifications`; on appointment create/edit, schedule local notifications at
  `startAt − leadMins` using the stored `reminderLeadMins`; cancel/reschedule on edit/delete (track the
  notification id on the row). Request notification permission at first schedule.
- **Pros:** works **fully offline**, no backend needed — fits the offline-first architecture; immediate,
  tangible value; the most direct answer to "notify before the reservation".
- **Cons:** device-local only (no cross-device); iOS limits the number of pending local notifications;
  must reconcile scheduled notifications when appointments change.

### B2. "Follow-up photos due" reminders  ⭐ 🧩
Remind the doctor when a case is due for its next before/after capture, even without a booked appointment.

- **How:** derive due dates from capture history + protocol intervals (see A9); schedule local
  notifications; surface a "Due this week" section on Home/Schedule.
- **Pros:** improves clinical data quality (timely, comparable after-photos) — a unique, clinical-grade
  hook competitors lack; drives repeat visits.
- **Cons:** needs the interval model; risk of nagging — make cadence configurable.

### B3. In-app notification center / banner  🔵
A bell icon with a list of reminders, due follow-ups, consent expiries, and sync issues.

- **How:** a derived feed from appointments + cases + consent + sync state; a `NotificationsScreen.js`
  and a Home header badge.
- **Pros:** centralizes "what needs my attention"; no OS-permission dependency.
- **Cons:** yet another surface to maintain; overlaps with Home's "active cases" if not curated.

### B4. Daily agenda summary notification  🔵
A morning push: "3 appointments today, first at 10:00 — Ayşe K., Lip Filler follow-up."

- **How:** schedule a repeating local notification at a user-set time; body assembled from the day's
  appointments.
- **Pros:** great daily ritual; low effort on top of B1.
- **Cons:** content is only as fresh as the last app open (local scheduling); a backend (B6) makes it
  reliable.

### B5. Client-facing reminders (SMS / WhatsApp / email)  🔵 🧩
Send the *client* a reminder/confirmation for their appointment.

- **How:** Phase-2 backend integration (Twilio/WhatsApp Business/email) triggered from the appointment;
  or a "share to WhatsApp" deep-link for a manual, no-backend MVP using the stored phone number.
- **Pros:** cuts no-shows materially; high perceived value for clinics.
- **Cons:** needs a backend + provider cost + consent for messaging; regulatory (marketing vs
  transactional) considerations; phone numbers are currently masked in seed data.

### B6. Push notifications via backend  🔵 🧩
True server-driven push (Expo Push) for cross-device reminders and team updates.

- **How:** register Expo push tokens; Phase-2 Supabase function schedules/sends. Builds on the sync work.
- **Pros:** reliable, cross-device, team-aware; foundation for collaboration alerts.
- **Cons:** **requires Phase 2** (backend, auth, tokens); more infra than local notifications.

### B7. Consent-expiry & document reminders  🔵
Nudge when a client's consent is missing/old before a social post or a new case.

- **How:** reuse the `consent_events` audit trail; flag stale/absent consent; remind at booking time.
- **Pros:** reinforces Nature's privacy-first positioning; prevents blocked exports at the worst moment.
- **Cons:** "expiry" policy must be defined; risk of false urgency.

---

# CATEGORY C — Client & Case Management / CRM  ·  **(P1)**

Round out the "track your clients and their data" promise.

### C1. Client appointment history on the profile  ⭐ 🧩
Show past + upcoming appointments on [`ClientProfileScreen.js`](../src/screens/ClientProfileScreen.js).
- **Pros:** one place for the full relationship; trivial once A1 exists. **Cons:** none significant.

### C2. Client tags / segments (VIP, new, follow-up due)  🔵
Filterable labels on clients.
- **Pros:** powerful with search + schedule filters. **Cons:** another taxonomy to manage.

### C3. Notes & treatment-plan timeline per client  🔵
Free-text clinical notes with timestamps, separate from photos.
- **Pros:** rounds out the record; the `notes` field already exists on clients. **Cons:** clinical-record
  retention/privacy obligations grow.

### C4. Quick-add client from the schedule  ⭐ 🧩
Inline "new client" while booking (reuse [`NewClientScreen.js`](../src/screens/NewClientScreen.js)).
- **Pros:** removes friction at booking time. **Cons:** minor flow plumbing.

### C5. Duplicate-client detection & merge  🔵
Warn on similar name/phone; offer merge.
- **Pros:** keeps the archive clean. **Cons:** merging nested case/photo data is fiddly.

### C6. Birthday / re-engagement reminders  🔵 🧩
Nudge to reach out to lapsed clients.
- **Pros:** marketing value. **Cons:** needs DOB field + messaging (B5).

---

# CATEGORY D — Capture & Clinical Workflow  ·  **(P1–P2)**

Deepen the core posing helpers that differentiate Nature.

### D1. Pre-appointment capture checklist  ⭐ 🧩
From an upcoming appointment, preview the angle checklist so the doctor knows the shot list before the
client arrives.
- **Pros:** ties scheduling to capture; reuses [`AngleChecklistScreen.js`](../src/screens/AngleChecklistScreen.js).
- **Cons:** minor.

### D2. Lighting / framing consistency assistant  🔵
Warn when after-shot lighting/zoom/angle drifts from the before reference (the README flags overlay
alignment as the area most needing on-device tuning).
- **Pros:** better, more comparable before/afters — the product's core value. **Cons:** real CV work;
  device-specific tuning.

### D3. Bake redaction into exports  ⭐
The README notes eye redaction is **in-app overlay only** — exported/shared assets aren't baked yet.
- **How:** render the redacted composite via `react-native-view-shot` (already a dependency) at export.
- **Pros:** closes a real privacy gap before anything leaves the device. **Cons:** must match overlay
  geometry exactly across `cover`/mirroring.

### D4. Video / 360° capture  🔵
Short clips or multi-frame turns for dynamic results.
- **Pros:** richer documentation & social content. **Cons:** storage, redaction-on-video, and UI cost.

### D5. Measurement / annotation overlays  🔵
Lines, areas, injection-point markers on photos.
- **Pros:** clinically valuable. **Cons:** new editor surface; data model for annotations.

### D6. Auto-cleanup of abandoned empty cases/sessions  ⭐
The README lists abandoned half-finished captures leaving empty case/session rows as a known issue.
- **Pros:** data hygiene; small, well-scoped. **Cons:** must not delete intentionally-empty records.

---

# CATEGORY E — Social Media & Marketing  ·  **(P2)**

Extend the existing content-creation strength.

### E1. Finish the export pipeline (mock → real)  ⭐
[`social-media.md`](./social-media.md) documents that Save/Share are still toasts and previews use the
placeholder subject.
- **Pros:** turns a built-out wizard into a shippable feature. **Cons:** real rendering + share-sheet work.

### E2. Schedule a post for later  🔵 🧩
Queue a post to publish/remind at a chosen time (pairs naturally with the new scheduler).
- **Pros:** reuses the scheduling + notification infra. **Cons:** true auto-publish needs platform APIs +
  backend; a reminder-to-post MVP avoids that.

### E3. Caption & hashtag helper  🔵
Suggested captions/hashtags per treatment (optionally AI-assisted).
- **Pros:** saves time; on-brand. **Cons:** AI adds a dependency/cost; tone/medical-claims guardrails.

### E4. Templated brand kit (colors, logo, fonts)  🔵
Clinic-wide post styling presets.
- **Pros:** consistent branding; Settings already references an export logo. **Cons:** template-engine
  scope.

### E5. Post performance log  🔵 🧩
Track which posts were shared/when (the `posts` table already stores `status`/`sharedAt`).
- **Pros:** cheap insight. **Cons:** real engagement metrics need platform APIs.

---

# CATEGORY F — Analytics & Business Insights  ·  **(P2)**

### F1. Schedule utilization dashboard  🔵 🧩
Bookings/day, no-show rate, busiest treatments/practitioners — derived from appointments + status.
- **Pros:** strong ROI story for clinic owners; data is a byproduct of A1/A7. **Cons:** needs enough data
  to be meaningful.

### F2. Treatment & revenue mix  🔵
Counts (and optional price) per treatment over time.
- **Pros:** business value. **Cons:** introduces pricing/financial data (sensitivity, scope creep).

### F3. Follow-up compliance metric  🔵 🧩
% of cases with on-time after-photos.
- **Pros:** ties clinical quality to a number; reinforces B2. **Cons:** depends on interval model.

---

# CATEGORY G — Sync, Accounts & Multi-User  ·  **(P2, enables much of the above)**

### G1. Phase-2 Supabase sync  ⭐ 🧩
The data layer is already sync-ready (`dirty`/`serverId`/`updatedAt`); the Sync screen currently
simulates the queue ([README](../README.md) "Known limitations").
- **Pros:** unlocks backup, multi-device, push (B6), and team features. **Cons:** auth model, RLS,
  photo-upload, and conflict-resolution decisions.

### G2. Authentication & per-doctor accounts  🔵 🧩
Turn the practitioner labels into real users.
- **Pros:** prerequisite for multi-user schedules, audit, and client-facing messaging. **Cons:** auth UX +
  data-partitioning; medical-grade security expectations.

### G3. Roles (doctor / assistant / front-desk)  🔵 🧩
Front-desk books; doctor captures.
- **Pros:** matches real clinic workflow; makes the schedule a shared tool. **Cons:** needs G1/G2 +
  permissions.

### G4. Shared team calendar & real-time updates  🔵 🧩
Live multi-user schedule.
- **Pros:** the multi-practitioner end-state. **Cons:** real-time infra; conflict handling.

---

# CATEGORY H — Privacy, Security & Compliance  ·  **(P1 — non-negotiable for medical)**

### H1. App lock (PIN / biometric)  ⭐
Protect patient photos behind Face ID / passcode.
- **How:** `expo-local-authentication` gate on launch/resume.
- **Pros:** high trust value, low effort, expected for medical apps. **Cons:** dependency + lock-state UX.

### H2. Encryption at rest for the DB & photo files  🔵
Encrypt `nature.db` and/or photo files.
- **Pros:** strengthens the privacy story. **Cons:** key management; SQLCipher/native build complexity.

### H3. Consent & access audit log (extend `consent_events`)  🔵 🧩
Record who viewed/exported what.
- **Pros:** compliance-friendly; reuses an existing pattern. **Cons:** more meaningful with auth (G2).

### H4. Data export / deletion (client's right to erasure)  🔵
One-tap export or full delete of a client's data.
- **Pros:** GDPR/KVKK-aligned; trust. **Cons:** cascade-delete across files + (future) server.

### H5. Configurable redaction defaults per clinic  🔵
Clinic-wide privacy presets (Settings already exposes eye-style).
- **Pros:** extends existing settings. **Cons:** small.

---

# CATEGORY I — Platform, UX & Polish  ·  **(P3)**

### I1. Tab-bar navigation (Home · Schedule · Clients · Settings)  ⭐
Adding a top-level Schedule destination is the natural moment to introduce a tab bar.
- **Pros:** makes Schedule first-class; better IA as features grow. **Cons:** restructures
  [`navigation.js`](../src/navigation.js); needs design care to keep the calm aesthetic.

### I2. Localization (Turkish first) & real date/timezone handling  ⭐
Seed data is Turkish; scheduling makes correct locale/timezone formatting mandatory.
- **Pros:** clearly the target market; scheduling needs it anyway. **Cons:** i18n plumbing; replace the
  hardcoded `TODAY`.

### I3. Tablet / landscape layout for the calendar  🔵
A wider day/week grid shines on iPad.
- **Pros:** great for front-desk. **Cons:** responsive-layout work.

### I4. Device-calendar sync (`expo-calendar`)  🔵
Mirror Nature appointments into the OS calendar.
- **Pros:** appointments show up alongside the doctor's personal calendar. **Cons:** two-way sync is
  tricky — start one-way (Nature → device).

### I5. Dark mode  🔵
- **Pros:** comfort; modern expectation. **Cons:** theme tokens exist but need a full dark palette pass.

### I6. Empty/loading/error states & onboarding for Schedule  🔵
- **Pros:** polish; first-run guidance. **Cons:** routine but time-consuming.

---

## Suggested phasing (a possible roadmap)

| Phase | Theme | Items |
|---|---|---|
| **1 — Schedule MVP** | See & control reservations | A1, A2, A5, A6, A7, C1, C4 |
| **2 — Reminders** | Don't miss anything | B1, B2, B4, A9, I2 |
| **3 — Make it first-class** | IA + clinical glue | I1, D1, D3, D6, B3, H1 |
| **4 — Backend & team** | Multi-user, push, client messaging | G1, G2, B5, B6, A11, F1 |
| **5 — Depth & polish** | Calendar grid, analytics, marketing | A3, A4, A8, E1, E2, F-series, I3–I6 |

> **If we build only one thing first:** A1 + A2 + A5 + A6 + B1 — a working schedule (data model + agenda +
> booking form), the appointment→capture handoff, and a local reminder before each appointment. That
> delivers the entire ask ("view/control sessions & reservations, notify before the time comes") with **no
> backend**, fully offline, reusing the existing component library.

---

## New data the scheduling work introduces (summary)

```
appointments
  id, serverId, clientId, caseId?, practitioner, treatment,
  startAt (epoch ms), durationMin, status, room?, notes,
  reminderLeadMins (JSON), notificationIds (JSON),  ← so edits can cancel/reschedule
  sessionId? (set when an appointment becomes a capture session),
  createdAt, updatedAt, dirty
```
- Follows the existing `serverId / updatedAt / dirty` convention → **Phase-2 sync with no migration**.
- `treatments.js` may gain a per-treatment **recommended follow-up interval** (for A9 / B2).
- Replace the hardcoded `TODAY` ([`helpers.js`](../src/data/helpers.js)) with a real clock + locale/timezone util.

## Dependencies these ideas would add (when built)

| Need | Likely package |
|---|---|
| Local reminders (B1–B4, B7) | `expo-notifications` |
| Date/time picker (A5) | `@react-native-community/datetimepicker` (or Expo-compatible) |
| App lock (H1) | `expo-local-authentication` |
| Device-calendar mirror (I4) | `expo-calendar` |
| Calendar grid (A3/A4), optional | `react-native-calendars` (evaluate vs. bespoke to keep the design language) |
| Baked redaction / composed exports (D3, E1) | `react-native-view-shot` *(already installed)* |

> **Reminder:** verify exact APIs against the **Expo SDK 56** docs
> (<https://docs.expo.dev/versions/v56.0.0/>) before implementing any of the above, per the repo's
> [`AGENTS.md`](../AGENTS.md).
