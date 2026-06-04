# Nature — Data Model

This document is the source of truth for **how clinical data is shaped and stored** in the
Nature app: the domain entities (client → case → session → photo), the local SQLite schema,
the photo-file strategy, and the Supabase sync contract.

> **Status legend**
> - 🟢 **Implemented** — exists in code today (currently an **in-memory** store; see
>   [`src/store.js`](../src/store.js), [`src/data/`](../src/data)).
> - 🟡 **Decided / planned** — the agreed target design, not yet wired up.
>
> Today the app holds everything in memory and resets on reload. The schema below is the
> persistence layer we're migrating to (SQLite source-of-truth → Supabase sync → gallery mirror).

---

## 1. Architecture overview 🟡

```
┌──────────────────────── app (19 screens) ────────────────────────┐
│   store API (unchanged):  clients · addClient · addCase ·         │
│                           capturePhoto · bump                     │
└───────────────┬───────────────────────────────────────┬──────────┘
                │ repository layer (same API, new backing)│
   ┌────────────▼────────────┐                ┌───────────▼───────────────┐
   │ expo-sqlite             │ ── sync ──►     │ Supabase                   │
   │ SOURCE OF TRUTH         │  dirty rows +   │ Postgres mirror tables     │
   │ clients/cases/sessions/ │  photo upload   │ + Storage bucket (photos)  │
   │ photos/consent_events   │ ◄── pull ──     │ + RLS per clinic           │
   └────────────┬────────────┘                └────────────────────────────┘
                │ photo binaries
   ┌────────────▼─────────────────────────────────────────────────┐
   │ app-private document dir (record's source of truth)            │
   │   + mirrored copy into a "Nature" album in the device gallery  │
   └────────────────────────────────────────────────────────────────┘
```

**Principles**

- **Offline-first.** SQLite + local files are authoritative; the network is only a sync target.
  Capture, client/case creation, and review all work with no connectivity.
- **Privacy by default.** Originals are stored untouched; eye-hidden / cropped *display* versions
  are generated only at export time, never overwriting the original.
- **Consent is never implied.** Clinical-archive consent and social-media consent are separate
  fields and separately audited; social export is blocked until social consent is granted.

---

## 2. Domain entities

The relationship is a strict hierarchy:

```
Client 1───* Case 1───* Session 1───* Photo (one slot per required/optional angle)
```

### 2.1 Client 🟢

A person under care. Search is by `name`, `code`, or `phone`.

| Field             | Type      | Notes |
|-------------------|-----------|-------|
| `id`              | string    | Local id (`uid()`), stable across the device. |
| `code`            | string    | Human client code, e.g. `NAT-0142`. Assigned automatically. |
| `name`            | string    | Display name (may be a code-only label). |
| `phone`           | string    | Optional, masked in seed data. |
| `consentClinical` | boolean   | May store photos in the medical record. |
| `consentSocial`   | boolean   | May export before/after social posts. **Independent** of clinical. |
| `eyeDefault`      | enum      | `hidden` \| `visible` — default privacy for this client's display versions. |
| `notes`           | string    | Optional free text (allergies, history…). |
| `initials`        | string    | Derived from `name`, used for the avatar. |
| `cases`           | Case[]    | (in-memory only) child cases; in SQLite this is a FK on `cases`. |

### 2.2 Treatment Case 🟢

One treatment protocol applied to a client over time (e.g. *Lip Filler, started 21 May*).
The treatment **type drives** the required angles, camera overlays, and default post template —
there is no manual photo filing.

| Field          | Type        | Notes |
|----------------|-------------|-------|
| `id`           | string      | Local id. |
| `treatment`    | enum        | One of the treatment ids (see §5.1). |
| `started`      | date (ISO)  | `YYYY-MM-DD`. |
| `practitioner` | string      | e.g. `Dr. Demir`. |
| `sessions`     | Session[]   | (in-memory) ordered oldest→newest; FK on `sessions` in SQLite. |

### 2.3 Session 🟢

A single capture event within a case — either the baseline **before** or a follow-up **after**.
The `kind` decides camera behavior: `before` uses a generic alignment guide; `after` loads a prior
photo as a ghost overlay.

| Field       | Type       | Notes |
|-------------|------------|-------|
| `id`        | string     | Local id. |
| `kind`      | enum       | `before` \| `after`. |
| `label`     | string     | e.g. `Baseline Before`, `After 2 weeks` (see §5.2). |
| `date`      | date (ISO) | `YYYY-MM-DD`. |
| `refSource` | enum?      | After-sessions only: `baseline` \| `previous` \| `custom` — which photo loads as the overlay. |
| `photos`    | map        | (in-memory) `{ [angleId]: Photo }`; in SQLite this is rows in `photos`. |

### 2.4 Photo 🟢

One captured slot, keyed by the **angle id** of its treatment protocol. Required angles must be
captured to complete a session; optional angles may be skipped.

| Field       | Type     | Notes |
|-------------|----------|-------|
| `angleId`   | string   | Matches an angle in the treatment protocol (§5.1). |
| `status`    | enum     | `captured` \| `missing` \| `retake` \| `optional` \| `skipped`. |
| `eyeHidden` | boolean  | Whether the privacy display version hides the eyes. |
| `tag`       | string?  | Optional grouping tag (`before` / `after`) used by seed data. |
| `localUri`  | string?  | 🟡 path to the original file in the app's document dir. |
| `remoteUrl` | string?  | 🟡 Supabase Storage URL once uploaded. |

> The **eye-hide style** (`blur` \| `bar` \| `pixel`) is a clinic-wide display setting, not a
> per-photo field — see §5.4.

### 2.5 Consent Event 🟡

Append-only audit trail for consent changes (clinical record requirement). The current UI shows
"Granted · 21 May 2026"; this table makes that real and inspectable.

| Field      | Type       | Notes |
|------------|------------|-------|
| `id`       | string     | Local id. |
| `clientId` | FK→clients | |
| `kind`     | enum       | `clinical` \| `social`. |
| `granted`  | boolean    | New value. |
| `at`       | timestamp  | When it changed. |

---

## 3. SQLite schema 🟡

Source of truth on the device. Every business row carries **sync columns** (`serverId`,
`updatedAt`, `dirty`) so a backend can be added without migration. Booleans are stored as
`INTEGER` (0/1), dates/timestamps as ISO `TEXT`.

```sql
CREATE TABLE clients (
  id               TEXT PRIMARY KEY,
  serverId         TEXT,                       -- Supabase row id once synced
  code             TEXT NOT NULL,
  name             TEXT NOT NULL,
  phone            TEXT,
  consentClinical  INTEGER NOT NULL DEFAULT 1,
  consentSocial    INTEGER NOT NULL DEFAULT 0,
  eyeDefault       TEXT NOT NULL DEFAULT 'hidden',   -- 'hidden' | 'visible'
  notes            TEXT,
  initials         TEXT,
  updatedAt        TEXT NOT NULL,
  dirty            INTEGER NOT NULL DEFAULT 1        -- 1 = needs push to Supabase
);

CREATE TABLE cases (
  id            TEXT PRIMARY KEY,
  serverId      TEXT,
  clientId      TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  treatment     TEXT NOT NULL,                  -- 'lip' | 'botox' | ... (see §5.1)
  started       TEXT NOT NULL,                  -- ISO date
  practitioner  TEXT,
  updatedAt     TEXT NOT NULL,
  dirty         INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE sessions (
  id          TEXT PRIMARY KEY,
  serverId    TEXT,
  caseId      TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL,                    -- 'before' | 'after'
  label       TEXT NOT NULL,
  date        TEXT NOT NULL,                    -- ISO date
  refSource   TEXT,                             -- 'baseline' | 'previous' | 'custom'
  updatedAt   TEXT NOT NULL,
  dirty       INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE photos (
  id          TEXT PRIMARY KEY,
  serverId    TEXT,
  sessionId   TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  angleId     TEXT NOT NULL,                    -- matches a protocol angle id
  status      TEXT NOT NULL DEFAULT 'captured', -- captured|missing|retake|optional|skipped
  eyeHidden   INTEGER NOT NULL DEFAULT 1,
  localUri    TEXT,                             -- file in document dir
  remoteUrl   TEXT,                             -- Supabase Storage URL
  updatedAt   TEXT NOT NULL,
  dirty       INTEGER NOT NULL DEFAULT 1,
  UNIQUE (sessionId, angleId)                   -- one slot per angle per session
);

CREATE TABLE consent_events (
  id        TEXT PRIMARY KEY,
  clientId  TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  kind      TEXT NOT NULL,                      -- 'clinical' | 'social'
  granted   INTEGER NOT NULL,
  at        TEXT NOT NULL
);

CREATE INDEX idx_cases_client    ON cases(clientId);
CREATE INDEX idx_sessions_case   ON sessions(caseId);
CREATE INDEX idx_photos_session  ON photos(sessionId);
CREATE INDEX idx_clients_search  ON clients(name, code, phone);
```

The repository hydrates the in-memory tree the screens already expect
(`client.cases[].sessions[].photos{}`) by joining these tables, so **no screen code changes**.

---

## 4. Photo storage 🟡

Captured images are **binary files**, stored separately from the metadata above.

1. On capture, `expo-camera` returns a cache URI (the OS may purge it).
2. We **copy it into the app's document directory** — this copy is the record's source of truth:
   ```
   <documentDirectory>/photos/<clientId>/<caseId>/<sessionId>/<angleId>.jpg
   ```
   `photos.localUri` points here. The record never depends on a file the user could delete.
3. We **also mirror a copy into a "Nature" album** in the device gallery
   (`expo-media-library`) for quick access — honoring the gallery preference without making the
   record fragile.
4. Eye-hidden / cropped **display versions are generated on demand** at export; originals are
   never modified.

> ⚠️ **PHI note:** photos mirrored to the device gallery auto-sync to iCloud/Google Photos and are
> visible to anyone with the phone. The app-private copy (step 2) is what guarantees record
> integrity and is what gets uploaded to Supabase; the gallery mirror (step 3) is a convenience and
> can be turned off per clinic policy.

---

## 5. Reference data (enumerations) 🟢

### 5.1 Treatment protocols & angles

Defined in [`src/data/treatments.js`](../src/data/treatments.js). Each treatment auto-loads its
angle checklist. `req` = required to complete a session.

| Treatment id | Name             | Required angles | Optional angles |
|--------------|------------------|-----------------|-----------------|
| `lip`        | Lip Filler       | Front–Relaxed, Front–Smiling, Left 45°, Right 45° | Side Profile |
| `botox`      | Botox            | Front–Neutral, Brows Raised, Frowning, Front–Smiling | Left 45°, Right 45° |
| `nose`       | Rhinoplasty      | Front, Left Profile, Right Profile, Left 45°, Right 45° | Base View |
| `jaw`        | Jawline / Chin   | Front–Neutral, Left 45°, Right 45° | Left Profile |
| `eye`        | Under-eye        | Front–Neutral, Left 45°, Right 45° | — |
| `skin`       | Skin             | Front, Left 45°, Right 45° | Left Cheek |
| `hair`       | Hair Transplant  | Front Hairline, Top View, Crown | Donor Area |
| `custom`     | Custom Protocol  | Front, Left 45° | — |

Each angle record: `{ id, name, code, req }` (e.g. `{ id:'l45', name:'Left 45°', code:'L-45', req:true }`).
`code` is the short uppercase label shown on the photo overlay.

### 5.2 Session labels

From [`src/data/treatments.js`](../src/data/treatments.js):

- **Before:** `Initial Before`, `Pre-treatment`, `First Visit`, `Baseline`
- **After:** `After 1 week`, `After 2 weeks`, `After 1 month`, `Session 2 Before`, `Session 2 After`, `Final Result`

### 5.3 Status values

`captured` · `missing` · `retake` · `optional` · `skipped` (rendered by `StatusTag`).

### 5.4 Display / clinic settings

| Setting     | Values                     | Scope |
|-------------|----------------------------|-------|
| `eyeStyle`  | `blur` (default) · `bar` · `pixel` | clinic-wide (Settings) |
| eyes hidden | on by default              | clinic-wide |

---

## 6. Transient (not persisted) — social post config 🟢

The Create-Post wizard builds a config object passed through navigation params only; it is **not**
stored. Shape:

```js
cfg = {
  sel:      string[],            // selected angle ids
  mode:     'single'|'carousel'|'timeline',
  format:   '1:1'|'4:5'|'9:16',
  template: 'split'|'slider'|'timeline'|'single',
  privacy:  { eyes:'hidden'|'visible', name, treatment, date, logo, doctor, disclaimer } // booleans
}
```

Only the **exported asset** (and the fact that it was exported) would be persisted, if at all.

---

## 7. Supabase sync contract 🟡

- **Mirror tables** in Postgres match §3 (server-side `id` ↔ local `serverId`).
- **Push:** rows with `dirty = 1` are upserted by `serverId`; photo files in `localUri` without a
  `remoteUrl` are uploaded to a Storage bucket, then `remoteUrl` is set and `dirty` cleared.
- **Pull:** rows changed since the last sync (`updatedAt`) are merged back.
- **Conflict policy:** last-write-wins on `updatedAt` for the MVP (revisit if multi-device editing
  becomes common).
- **RLS:** scoped per clinic / practitioner.
- **Pending:** Supabase project URL + anon key, and the auth model (per-practitioner login vs. a
  shared service account) — required before this layer is wired.

---

## 8. Where it lives in code

| Concern | File |
|---|---|
| Treatment protocols, angles, labels | [`src/data/treatments.js`](../src/data/treatments.js) |
| Seed clients / cases / sessions | [`src/data/seed.js`](../src/data/seed.js) |
| Helpers (`reqAngles`, `capCount`, `uid`, date fmt, `TODAY`) | [`src/data/helpers.js`](../src/data/helpers.js) |
| Store API + actions (`addClient`, `addCase`, `capturePhoto`) | [`src/store.js`](../src/store.js) |
| 🟡 SQLite repository / migrations | _to be added: `src/db/`_ |
| 🟡 Supabase client + sync engine | _to be added: `src/sync/`_ |
