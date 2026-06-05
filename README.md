# Nature — Clinical Posing

A React Native + Expo implementation of the **Nature** clinical before/after photo app, built from the
`clinic-pose` Claude Design handoff bundle (`Nature.html` + the 22-screen flow report).

Doctors capture standardized **before / after** photo series (auto-loaded per treatment protocol), align
after-shots to the prior photo with a **ghost camera overlay**, compare results, and produce
privacy-safe **social-media posts** — with clinical and social consent kept strictly separate.

---

## Stack

| Concern | Choice |
|---|---|
| Runtime | Expo SDK 56 (React Native 0.85, React 19) |
| Navigation | `@react-navigation/native-stack` |
| Camera | `expo-camera` (`CameraView` + `useCameraPermissions`) — real capture |
| Local store | `expo-sqlite` (clients/cases/sessions/photos/consent, source of truth) |
| Photo files | `expo-file-system` (app-private copy) + `expo-media-library` (gallery mirror) |
| Eye redaction | `@infinitered/react-native-mlkit-face-detection` (detect) + `expo-blur` (blur style) |
| Vector UI | `react-native-svg` (icon set, treatment glyphs, photo silhouette) |
| Gradients | `expo-linear-gradient` |
| Fonts | `@expo-google-fonts/hanken-grotesk` + `@expo-google-fonts/geist-mono` |
| Haptics | `expo-haptics` (shutter feedback) |

## Running it

> **Node:** RN 0.85 wants Node `^20.19`, `^22.13`, or `>=24.3`. If `expo start` misbehaves on Node 23,
> switch with `nvm use 22` (or 24). Bundling has been verified via `npx expo export`.

```bash
cd nature
npm install            # already installed in this checkout

# (a) Quick iteration — Expo Go. Everything works EXCEPT auto eye-detection.
npx expo start         # press i / a, or scan the QR with Expo Go

# (b) Full app incl. ML Kit eye-detection — custom dev client.
npx expo prebuild      # generates native projects
npx expo run:ios       # or run:android — builds + installs the dev client
```

> **ML Kit needs a dev client.** Camera, SQLite, media-library and blur all ship inside **Expo Go**, so
> the app runs there — but `@infinitered/react-native-mlkit-face-detection` is a third-party native
> module that Expo Go can't load. The import is **guarded** ([faceDetection.js](nature/src/data/faceDetection.js)),
> so in Expo Go the app runs fine and auto eye-detection simply turns off (captured photos save with no
> stored eye box). For real detection, build a dev client with (b). iOS deployment target 16.4 (SDK 56
> default) already satisfies ML Kit.

- **Camera + eye detection** need a **physical device** (simulators have no camera). On the simulator the
  camera screen shows a **“Continue without camera (demo capture)”** link so the flow stays walkable;
  detection only runs when there's a real photo.
- First launch asks for camera permission, and the first gallery save asks for photo-library permission.

## Architecture

```
App.js                     fonts → SafeAreaProvider → AppProvider → NavigationContainer → RootNavigator + Toast
src/
  theme.js                 design tokens (colors, radii, density, shadows) + font-weight → family resolver
  store.js                 AppProvider (hydrates from SQLite, persists every mutation) + useApp / useNav
  navigation.js            native-stack with all 19 route components
  data/
    db.js                  SQLite schema, seed migration, loadAll() graph hydration, upsert/delete
    photos.js              persist capture → app-private file + mirror to "Nature" gallery album
    treatments.js          8 treatment protocols and their required/optional angles
    seed.js                first-launch demo clients, cases, sessions, recent activity
    helpers.js             date fmt, capture counts, ids, TODAY
  components/
    Txt.js                 Text wrapper that maps fontWeight → the correct Google-font variant
    Icon.js / TGlyph.js    stroke icon set + treatment glyphs (ported SVG path data)
    Photo.js               clinical "subject" silhouette w/ eye-hide (blur/bar/pixel) or real image
    ui.js                  TopBar, Btn, Card, Chip, Tag, Field, Input, Switch, Segmented, Steps,
                           StatusTag, Avatar, ConsentBadges, Sheet, Toast, Slider, ActionBar …
    Screen.js / Wizard.js  screen scaffold + the 4-step post wizard shell
    PostPreview.js         shared social-asset renderer (split / slider / timeline / single)
  screens/                 one file per screen (see mapping below)
```

The runtime working copy is an in-memory client graph held in a ref (version-bumped to re-render).
On launch `AppProvider` hydrates it from SQLite (seeding demo data on first run); every mutation goes
through a store method (`addClient`, `updateClient`, `setConsent`, `addCase`, `addSession`,
`capturePhoto`, `removePhoto`) that updates the graph **and** writes through to the database. Captured
photos are copied into app-private storage (the record's source of truth) and mirrored into a "Nature"
gallery album; the file path is what flows into timeline, review, compare and post screens.

### Persistence (Phase 1 — local, offline)

```
SQLite (nature.db)                         photo files
  clients   ─┐                               documentDirectory/photos/{client}/{case}/{session}/{angle}.jpg
  cases     ─┤ loadAll() rebuilds the         (app-private — the record of truth)
  sessions  ─┤ nested client→case→            └─ mirrored into the "Nature" album in the device gallery
  photos    ─┘ session→photo graph
  consent_events  (clinical audit trail)
```

Every row carries `serverId` / `updatedAt` / `dirty`, so **Phase 2 (Supabase sync)** can push dirty
rows + upload photos without a schema migration. Needs your project URL / anon key + an auth decision.

### Eye redaction (non-destructive)

The captured **original (eyes-visible)** is the source of truth — saved to private storage and mirrored
to the gallery unchanged. On capture, ML Kit detects the eyes once ([eyes.js](nature/src/data/eyes.js))
and stores a **normalized eye-box** + image dims on the photo row (`eyeBoxes` / `imgW` / `imgH`). The app
then draws the hide overlay from that geometry ([Photo.js](nature/src/components/Photo.js)) — bar / pixel
(SVG) or blur (`expo-blur`) per the Settings eye-style — so toggling eyes on/off is instant and never
re-detects. The gallery copy is **not** redacted (eyes-visible originals, by design).

## Screen mapping (flow report → code)

| Report | Screen | File |
|---|---|---|
| S1 | Home / Dashboard | `screens/HomeScreen.js` |
| S2 | Client Search | `screens/ClientSearchScreen.js` |
| S3 | Client Profile | `screens/ClientProfileScreen.js` |
| S4 | New / Edit Client | `screens/NewClientScreen.js` |
| S5 | Treatment Picker | `screens/TreatmentPickerScreen.js` |
| S6 | New Case Setup | `screens/CaseSetupScreen.js` |
| S7 | Case Timeline | `screens/TimelineScreen.js` |
| S8 | Session Setup | `screens/SessionSetupScreen.js` |
| S9 | Angle Checklist | `screens/AngleChecklistScreen.js` |
| S10/S11/S12 | Camera (generic + before-overlay) & quick review | `screens/CameraScreen.js` |
| S13 | Session Review | `screens/SessionReviewScreen.js` |
| S14 | Before/After Compare | `screens/CompareScreen.js` |
| S15–S19 | Create-Post wizard + Export | `screens/Post{Select,Format,Template,Privacy,Export}Screen.js` |
| S20 | Settings | `screens/SettingsScreen.js` |
| S21 | Sync Status | `screens/SyncScreen.js` |
| S22 | Consent Detail | sheet inside `ClientProfileScreen` + guard in `PostPrivacyScreen` |

## Design-fidelity decisions

- **Defaults-only variant**, as requested: eye-hide `blur`, roundness `soft`, density `regular`, Home
  `spotlight`, Timeline `vertical`, Camera `classic`. The prototype's device frames and Tweaks panel were
  scaffolding for the HTML preview and are intentionally **not** reproduced (the real device supplies the
  bezel/status bar/safe areas). The eye-hide style remains adjustable in **Settings**.
- **Privacy & consent** are faithful to the spec: eyes hidden + no client name by default, originals
  untouched, and **export is blocked** until social-media consent is granted (with an inline "record
  consent now" path).
- **The after-camera overlay** loads the matching before photo as an adjustable-opacity ghost (real image
  when one was captured in-session; an alignment guide otherwise), plus rule-of-thirds grid, flip, and a
  "use generic guide instead" fallback.

## Known limitations (MVP preview)

- **Persistence is local-only (Phase 1).** Clients/cases/sessions/photos survive reloads via SQLite, and
  captured photos persist to private storage + the gallery. Cloud sync (Supabase) is **Phase 2** — the
  Sync screen still simulates the upload queue until that's wired.
- Abandoning a half-finished capture still leaves the just-created (empty) case/session behind, since the
  record is created on entry — a data-lifecycle item for the logic pass.
- Photos are persisted only on **Keep** (capture is staged for review; Retake discards it), so discarded
  shots never touch disk or the gallery. Files are named `{angleId}.jpg` (no timestamp); re-capturing an
  angle overwrites its private file but leaves the previous gallery mirror (iOS prompts to delete assets).
- **Eye redaction is in-app only (this pass).** It's a non-destructive overlay from stored eye geometry;
  exported/shared social assets are **not** baked yet (deferred). Angles where ML Kit finds no eyes
  (profile, base view, crown) get no overlay. Overlay alignment under `cover` + EXIF/front-camera mirroring
  is the bit most likely to need on-device tuning — verify the box lands on the eyes across angles.
- Compare/post **before vs. after** previews still use the placeholder subject (no per-angle real image
  wired into Compare yet); the capture/review/timeline screens show actual captured photos.
- "Save to gallery" / "Share" on the export screen still surface confirmation toasts rather than rendering
  the composed asset to the gallery / system share sheet.
