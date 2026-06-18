# Capture Overlays — Per-Angle Alignment Guides

> **Goal.** Give the doctor a per-angle *alignment overlay* (a face-shaped guide) to pose
> the subject into, instead of today's single generic dashed oval. Just as importantly:
> establish a **workflow that makes adding a new overlay fast** — drop in one declarative
> entry, calibrate it on-device with a tool, done — so the overlay set can grow with the
> protocol library without touching `CameraScreen`.

This is a **plan only**. No code is written yet. It describes the data model, the resolver,
the render path, the authoring/calibration workflow, the integration points, and a phased
rollout with acceptance criteria.

---

## 1. Where we are today

| Concern | Today | Implication |
|---|---|---|
| Alignment guide | One hardcoded SVG `GhostGuide()` in [`CameraScreen.js`](../src/screens/CameraScreen.js) (ellipse + rect) | Same shape for Front, 45°, Profile, Crown… — doesn't actually help frame an angle |
| After-shot overlay | Ghost of the matching before photo at adjustable opacity | Per-session image, *not* a designed guide — keep this as-is |
| Per-angle geometry | [`defaultEyeBox(angle)`](../src/data/eyeDefaults.js) derives a normalized eye-box from the angle **`code`** via regex | Proves the pattern: **angle `code` → geometry**, with a generic fallback |
| Angle definitions | [`treatments.js`](../src/data/treatments.js): each angle is `{ id, name, code, req }` | Codes (`FRONT`, `L-45`, `R-45`, `PROFILE`, `BASE`, `CROWN`…) **repeat across all 8 treatments** |
| Vector primitives | `react-native-svg`; icons/glyphs are normalized SVG path data | Overlays should be SVG primitives too — themeable, crisp, no asset pipeline |
| Coordinate convention | Eye boxes normalized `0..1` over a `cover`-cropped container ([`eyeGeometry.js`](../src/data/eyeGeometry.js)) | Reuse normalized coords; guides live in **viewport space** (see §4) |

### The key leverage point
Angle `code`s are shared. The ~40 angle entries across 8 treatments collapse to roughly
**9–10 distinct overlay shapes**:

| Overlay id | Matches codes | Used by |
|---|---|---|
| `front` | `FRONT`, `FRONT/REL`, `FRONT/SMI`, `FRONT/NEU`, `BROWS`, `FROWN` | every treatment |
| `oblique-l` / `oblique-r` | `L-45` / `R-45` | lip, botox, nose, jaw, eye, skin |
| `profile-l` / `profile-r` | `L-PROF`, `R-PROF`, `PROFILE` | nose, jaw, lip |
| `base` | `BASE` | nose |
| `hairline` | `HAIRLINE` | hair |
| `scalp-top` | `TOP`, `CROWN` | hair |
| `donor` | `DONOR` | hair |
| `cheek-l` / `cheek-r` | `L-CHEEK` | skin |

So a **code-keyed resolver** means you author ~10 overlays once and *all* treatments
(including new ones) light up automatically. That is the workflow win.

---

## 2. Design principles

1. **Declarative, not imperative.** An overlay is data (normalized SVG primitives), not a
   bespoke component. One render path draws any overlay.
2. **Resolve by `code`, override by `id`.** Default behavior: angle `code` → overlay, zero
   config. Escape hatch: an angle may set an explicit `overlayId` to opt out of the default.
   This mirrors `defaultEyeBox` exactly, so it's already familiar in the codebase.
3. **Generic fallback never breaks capture.** Unknown code → the current generic guide.
   Missing overlay must never blank the screen or block a shot.
4. **Calibrate, don't guess.** Coordinates come from an on-device calibration tool that
   reports normalized numbers, not from eyeballing percentages in source.
5. **Match existing conventions.** Normalized `0..1` coords, `react-native-svg` primitives,
   path-data strings (like `Icon.js`) for organic curves, theme colors.

---

## 3. Overlay data model

New file: **`src/data/overlays.js`** (registry) + **`src/data/overlayResolver.js`** (lookup),
or a single `overlays.js` exporting both — co-located with `eyeDefaults.js` since they're siblings.

An overlay is a list of **normalized vector primitives** drawn in viewport space:

```js
// shape sketch — illustrative, not final
export const OVERLAYS = {
  front: {
    id: 'front',
    label: 'Front',
    flippable: false,              // mirror with the front camera? (see §4)
    shapes: [
      { kind: 'ellipse', cx: 0.50, cy: 0.52, rx: 0.23, ry: 0.33 }, // face oval
      { kind: 'line',    x1: 0.50, y1: 0.20, x2: 0.50, y2: 0.84 }, // vertical midline
      { kind: 'rect',    x: 0.29, y: 0.40, w: 0.42, h: 0.085, rx: 0.012 }, // eye band
      { kind: 'line',    x1: 0.33, y1: 0.66, x2: 0.67, y2: 0.66 }, // lip line
    ],
  },
  'oblique-l': { id: 'oblique-l', label: 'Left 45°', flippable: true, side: 'L', shapes: [/* tilted oval, offset midline */] },
  'profile-l': { id: 'profile-l', label: 'Left Profile', flippable: true, side: 'L',
    shapes: [ { kind: 'path', d: 'M0.62,0.20 C ... 0.62,0.84' } ] }, // half-face + nose curve as path data
  // ...base, hairline, scalp-top, donor, cheek-*
};
```

**Primitive kinds** (small, closed set the renderer understands): `ellipse`, `rect`, `line`,
`path` (SVG `d` string for organic curves — e.g. a profile/nose silhouette). All coords/sizes
normalized `0..1` of the preview box. `path` lets a designer paste an exported SVG path and
keep crisp curves, exactly how `Icon.js`/`TGlyph.js` already carry path data.

**Optional metadata per overlay:** `label` (calibration UI + checklist), `flippable` /
`side` (front-camera mirroring), and later `tips` (a one-line posing hint shown under the
shutter).

### Resolver (mirrors `defaultEyeBox`)

```js
// shape sketch
const RULES = [
  [/PROF|PROFILE/, (side) => `profile-${side}`],
  [/CHEEK/,        (side) => `cheek-${side}`],
  [/45/,           (side) => `oblique-${side}`],
  [/BASE/,         () => 'base'],
  [/HAIRLINE/,     () => 'hairline'],
  [/CROWN|TOP/,    () => 'scalp-top'],
  [/DONOR/,        () => 'donor'],
];

export function resolveOverlay(angle /*, treatmentId */) {
  if (angle?.overlayId) return OVERLAYS[angle.overlayId] || GENERIC; // explicit override
  const code = (angle?.code || '').toUpperCase();
  const side = code.startsWith('R') ? 'r' : 'l';
  for (const [re, pick] of RULES) if (re.test(code)) return OVERLAYS[pick(side)] || GENERIC;
  return OVERLAYS.front; // FRONT*, BROWS, FROWN, anything face-on
}
```

`GENERIC` is the current dashed oval, kept as the universal safety net.

---

## 4. Render path — a single `GuideOverlay` component

New component: **`src/components/GuideOverlay.js`**.

```
<GuideOverlay overlay={resolveOverlay(a, cs.treatment)}
              color="rgba(120,180,255,0.85)" opacity={1}
              mirror={facing === 'front'} />
```

- Renders the overlay's `shapes` into one `<Svg>` filling the viewport, using
  `width/height="100%"` + percentage coords (like today's `GhostGuide`). No image-space math
  needed — the guide is normalized to the **preview box**, not to a captured image.
  > **Why viewport space, not image space:** the eye-box uses `coverTransform` because it sits
  > on top of a stored image with known dims. The alignment guide sits on the *live preview*,
  > so percentage-of-viewport is correct and simpler. Keep the two coordinate systems distinct.
- `mirror` flips X for the front camera so a "Left 45°" guide lines up with the mirrored
  selfie preview (`flippable` overlays only).
- Dashed stroke, theme accent color, `pointerEvents="none"`. This **replaces** the inline
  `GhostGuide()` and becomes the single guide renderer used by the camera, the calibration
  tool (§6), and optionally a mini-preview on the Angle Checklist.

This is the only place that knows how to turn primitive `kind`s into SVG elements — adding a
new overlay never touches it.

---

## 5. Integration into `CameraScreen`

Minimal, surgical changes ([`CameraScreen.js`](../src/screens/CameraScreen.js)):

1. Import `resolveOverlay` + `GuideOverlay`; compute `const guide = resolveOverlay(a, cs.treatment)` (recomputed when `idx` changes).
2. Replace the `GhostGuide` render at [L147](../src/screens/CameraScreen.js#L147) with
   `<GuideOverlay overlay={guide} mirror={facing === 'front'} />`.
3. **Layering stays the same:**
   - *Before* capture → show the angle guide (this is the upgrade).
   - *After* capture → before-photo ghost first, with the angle guide optionally drawn on top
     at lower opacity (so the doctor has both the prior frame *and* the canonical shape). The
     existing "use generic guide" toggle now means "guide-only, no ghost photo."
4. The mode chip ("GENERIC GUIDE" / "BEFORE OVERLAY") gains a third state, e.g.
   "FRONT GUIDE" / "L-45 GUIDE", sourced from `guide.label`.
5. Optional: surface `guide.tips` under the shutter (replaces the static hint string at
   [L198-200](../src/screens/CameraScreen.js#L198-L200)).

No change to capture/keep/retake, persistence, or eye-redaction — overlays are draw-only.

---

## 6. The authoring workflow (the "add overlays fast" part)

Two paths, by who's adding the overlay.

### 6a. Add a new overlay — the fast path
1. **Add one entry** to `OVERLAYS` in `src/data/overlays.js` (id, label, shapes).
2. If its angle `code` already maps via a `RULES` regex → **nothing else to do**; every angle
   with that code in every treatment picks it up. If it's a brand-new code, add one `RULES`
   line (or set `overlayId` on the specific angle in `treatments.js`).
3. **Calibrate** the numbers with the tool (6c), paste them back.
4. Done — no `CameraScreen` edits, no asset bundling, no native rebuild.

### 6b. Map an existing overlay to a new treatment/angle
Adding a treatment in `treatments.js` with familiar codes (`FRONT`, `L-45`…) needs **zero**
overlay work — the resolver already covers it. Only genuinely new shapes require 6a.

### 6c. On-device calibration tool (dev-only)
New dev screen: **`src/screens/OverlayCalibrateScreen.js`**, route `overlayCalibrate`,
reachable from Settings **only when `__DEV__`** (never ships to clinicians).

- Live `CameraView` (or a loaded sample face photo) + the selected `GuideOverlay` on top.
- Pickers: treatment → angle (or raw overlay id). Reuses existing `Segmented`/`Chip` from
  [`ui.js`](../src/components/ui.js).
- Sliders (reuse the existing `Slider`) for **offsetX, offsetY, scale, rotation**, applied as
  a transform on the whole overlay; optionally per-shape nudge for fine work.
- **"Copy values"** button → writes the resulting normalized `shapes` (transform baked in) to
  the clipboard and logs them, ready to paste into `OVERLAYS`.
- This closes the loop: you *see* the guide on a real face at a real angle and read off exact
  numbers instead of guessing percentages in source. This is what makes iteration fast and
  the guides actually fit.

> A static fallback if camera isn't available (simulator): render over a bundled reference
> face photo per angle so coordinates can still be dialed in.

---

## 7. Files touched

| File | Change | New? |
|---|---|---|
| `src/data/overlays.js` | `OVERLAYS` registry + `resolveOverlay()` + `GENERIC` | **new** |
| `src/components/GuideOverlay.js` | single SVG renderer for any overlay | **new** |
| `src/screens/OverlayCalibrateScreen.js` | dev-only calibration/authoring tool | **new** |
| `src/screens/CameraScreen.js` | swap `GhostGuide` → `GuideOverlay`, resolve per angle, mode chip/tip | edit |
| `src/data/treatments.js` | *optional* `overlayId` on angles that need a non-default shape | edit (opt) |
| `src/navigation.js` | register `overlayCalibrate` route (dev) | edit |
| `src/screens/SettingsScreen.js` | dev entry point to the calibration tool | edit |

Note the small surface: the *recurring* act of adding an overlay only ever touches
`overlays.js`. Everything else is one-time wiring.

---

## 8. Phased rollout

**Phase 1 — Foundation.** `overlays.js` (registry + resolver + `GENERIC`) and
`GuideOverlay`. Wire into `CameraScreen` with just `front` + `oblique-l/r` + the generic
fallback. Verify the resolver picks correctly for every treatment's angle list. *Outcome:*
front and 45° angles get real guides; everything else falls back gracefully.

**Phase 2 — Authoring tool.** `OverlayCalibrateScreen` + dev Settings entry + route. *Outcome:*
overlays can be calibrated on-device and numbers copied out.

**Phase 3 — Full overlay set.** Author/calibrate the remaining shapes (`profile-*`, `base`,
`hairline`, `scalp-top`, `donor`, `cheek-*`) using the tool. *Outcome:* every angle across all
8 treatments has a fitted guide.

**Phase 4 — Polish (optional).** Per-overlay posing tips, front-camera mirroring polish, a mini
guide thumbnail on the Angle Checklist, and a "fit feedback" hook (later: light face-landmark
nudges using the existing ML Kit dependency to color the guide green when aligned).

---

## 9. Acceptance criteria

- [ ] Each angle in every treatment renders a guide whose shape matches the angle (front oval,
      tilted 45° oval, half-face profile, scalp top-down, etc.).
- [ ] Adding a new overlay = **one entry in `overlays.js`** (+ at most one `RULES` line); no
      `CameraScreen` edit, no asset bundling, no native rebuild.
- [ ] Adding a new treatment that reuses existing codes needs **zero** overlay work.
- [ ] Unknown/missing code falls back to the generic guide; capture is never blocked.
- [ ] After-shot flow still shows the before-photo ghost; the angle guide layers on top and the
      generic-guide toggle still works.
- [ ] Calibration tool overlays a guide on a live/sample face and copies out paste-ready
      normalized coordinates; it is unreachable in production builds.
- [ ] Front-camera preview mirrors `flippable` guides so left/right read correctly.

---

## 10. Open questions

1. **Curves vs. primitives.** Are `ellipse`/`rect`/`line` enough for the simple guides, with
   `path` reserved for profile/nose silhouettes? (Recommended: yes — start minimal.)
2. **Designer handoff.** Will overlays be hand-tuned in the calibration tool, or exported from
   a design file as SVG paths and pasted in? (The `path` kind supports both.)
3. **Mirroring default.** Should the guide mirror with the front camera, or always show the
   anatomical (un-mirrored) orientation? Affects how `flippable`/`side` are interpreted.
4. **Smart fit (later).** Worth using the already-bundled ML Kit landmarks to turn the guide
   green / nudge the doctor when the face is aligned, or keep overlays purely visual for now?
