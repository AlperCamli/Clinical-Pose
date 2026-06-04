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
npx expo start         # then press i / a, or scan the QR with Expo Go
```

- **Camera:** the live preview and real photo capture need a **physical device** (simulators have no
  camera). On the iOS Simulator / Android emulator the camera screen shows a permission prompt with a
  **“Continue without camera (demo capture)”** link so the whole flow stays walkable without hardware.
- First launch asks for camera permission (copy is set in `app.json`).

## Architecture

```
App.js                     fonts → SafeAreaProvider → AppProvider → NavigationContainer → RootNavigator + Toast
src/
  theme.js                 design tokens (colors, radii, density, shadows) + font-weight → family resolver
  store.js                 AppProvider (in-memory client store + tweaks + toast) and useApp / useNav hooks
  navigation.js            native-stack with all 19 route components
  data/
    treatments.js          8 treatment protocols and their required/optional angles
    seed.js                seed clients, cases, sessions, recent activity
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

State mirrors the prototype: a mutable client store in a ref with a version bump, navigation params
carry `cid` / `caseId` / `sessionId`, and captured photos (including real `uri`s) flow through the
`store.capturePhoto` action into the timeline, review, compare and post screens.

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

- Data is in-memory (resets on reload); no backend/persistence/real sync yet — the Sync screen simulates
  the offline upload queue as in the design.
- Compare/post **before vs. after** images use the same placeholder subject (the prototype had no real
  brightness filter); with real captured photos each angle shows its actual image.
- "Save to gallery" / "Share" surface confirmation toasts rather than writing to the OS gallery / share
  sheet (would add `expo-media-library` / `Sharing` in a follow-up).
