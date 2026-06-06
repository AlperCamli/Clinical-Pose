# Nature — Eye Redaction & Overlays

How Nature hides patient eyes in clinical photos, how the blur is sized and styled, and how to
add new **angles**, **overlay guides**, and **blur variations** with minimal code.

> **Status legend**
> - 🟢 **Implemented** — exists in code today.
> - 🟡 **Decided / planned** — agreed target design, not yet wired up.

---

## 1. Model 🟢

Redaction is **detection-free** and **non-destructive**:

- The captured original (eyes visible) is the source of truth — saved to private storage and the
  gallery **unchanged**.
- Each photo stores an array of **eye boxes**, each normalized to the image so it survives the file
  copy and renders identically on every screen:

  ```js
  // one block; eyeBoxes: Box[]  (multiple blocks allowed — e.g. two eyes, nose visible)
  Box = { x, y, w, h, rot }
  //  x, y, w, h ∈ 0..1  (fraction of image width/height; x,y = top-left)
  //  rot         = degrees, clockwise, about the box centre (default 0)
  ```

- The app draws the cover overlay from that geometry, so toggling eyes on/off or switching style is
  instant and never re-processes the file. The gallery copy is never redacted (by design).

**Where it lives**

| Concern | File |
|---|---|
| Box ↔ screen mapping (cover crop) | [`src/data/eyeGeometry.js`](../src/data/eyeGeometry.js) — `coverTransform`, `coverRects`, `screenRectToBox` |
| Per-angle default box | [`src/data/eyeDefaults.js`](../src/data/eyeDefaults.js) — `defaultEyeBox(angle)` |
| Blur/pixel/bar **style registry** | [`src/data/redactionStyles.js`](../src/data/redactionStyles.js) |
| Renderer (`RedactionMark`) | [`src/components/Photo.js`](../src/components/Photo.js) |
| Manual editor (drag/resize/rotate, multi-box) | [`src/components/EyeBoxEditor.js`](../src/components/EyeBoxEditor.js) |
| Capture flow + review | [`src/screens/CameraScreen.js`](../src/screens/CameraScreen.js) |
| Edit-later sheet | [`src/screens/SessionReviewScreen.js`](../src/screens/SessionReviewScreen.js) |
| Persist edits | [`src/store.js`](../src/store.js) — `setPhotoEyeBoxes`, `setPhotoEyeHidden` |

> **Note:** ML Kit auto-detection ([`src/data/eyes.js`](../src/data/eyes.js),
> [`src/data/faceDetection.js`](../src/data/faceDetection.js)) is **retired** — it missed 45°/profile
> poses and could never cover crown/base angles. Files are left on disk, unwired. The overlay default
> + manual adjust is deterministic and works at every angle (and in Expo Go).

---

## 2. Current blur sizing 🟢

**Default boxes** (fractions of the image, from `eyeDefaults.js`) — seeds the doctor then adjusts:

| Pose (angle `code`) | Default box `w × h` | Notes |
|---|---|---|
| `FRONT*`, `BROWS`, `FROWN`, `HAIRLINE` | `0.48 × 0.12` | centred bar across both eyes |
| `L-45` / `R-45` | `0.44 × 0.12` | shifted to the near side, `rot ≈ ±4°` |
| `*PROF*`, `*CHEEK*` | `0.20 × 0.12` | single near eye |
| `CROWN`, `TOP`, `BASE`, `DONOR` | — (`null`) | no eyes in frame → no block |
| ＋ Add block (editor) | `0.16 × 0.10` | a fresh single-eye block |

**On-screen size.** The image is shown with `cover`, so a single uniform `scale` maps the normalized
box to pixels:

```
scale  = max(containerW / imgW, containerH / imgH)
blockPx = { w: box.w * imgW * scale, h: box.h * imgH * scale }   // before rotation
```

Example: a `0.48 × 0.12` front bar over a 3024×4032 photo shown in a 360-px-wide frame
→ scale ≈ 0.12 → ≈ `174 × 58 px` on screen.

**Style sizing & strength** (from `redactionStyles.js`):

| Style | `kind` | Corner radius | Strength |
|---|---|---|---|
| **Soft** (default) | `blur` | `min(w,h) × 0.45` (stadium) | feathered, intensity 70 iOS / 90 Android |
| **Strong** | `blur` | `min(w,h) × 0.30` | feathered, intensity 100 |
| **Pixel** | `pixel` | `min(w,h) × 0.18` | 10-px mosaic cells |
| **Bar** | `solid` | `min(w,h) × 0.18` | opaque ink |

**Why the blur looks smooth.** `RedactionMark` draws a **single** uniform `expo-blur` `BlurView` over
the whole block, generously rounded (`radiusFactor` up to `0.5` = pill ends) so the edges read soft.
`expo-blur` is a uniform effect — it can't truly feather without a native mask, so stacking layers
just produced a visible hard inner rectangle; one smooth layer is cleaner. It stays correct when the
block is rotated (the `BlurView` samples screen-space pixels behind it). Pure-JS / Expo-Go-safe.
(True edge feathering would need a native `MaskedView` + radial gradient — deferred.)

---

## 3. Recipes

### 3a. Add a blur variation 🟢
Add **one entry** to [`redactionStyles.js`](../src/data/redactionStyles.js) and list it in
`REDACTION_ORDER`. It appears in **Settings → Default eye-hide style** automatically and renders via
`RedactionMark`. Example — a coarse mosaic:

```js
mosaic: { id: 'mosaic', label: 'Mosaic', kind: 'pixel', cell: 18, radiusFactor: 0.18 },
// REDACTION_ORDER = ['blur', 'strong', 'pixel', 'bar', 'mosaic']
```

`kind` picks the renderer (`blur` | `pixel` | `solid`). A genuinely new *kind* (e.g. an emoji sticker)
means adding a branch to `RedactionMark` in `Photo.js`; reusing an existing kind is data-only.

### 3b. Add a capture angle 🟢
1. Add a row to the treatment's `angles` in [`treatments.js`](../src/data/treatments.js):
   ```js
   { id: 'l34', name: 'Left 3/4', code: 'L-34', req: false },
   ```
2. Give it a default eye region in [`eyeDefaults.js`](../src/data/eyeDefaults.js) — extend the
   `code`-matching rules (e.g. treat `*-34` like the 45° oblique). If the angle frames no eyes,
   return `null`. The angle now flows through the checklist, camera, review, timeline, and compare
   with no further changes.

### 3c. Add / improve an overlay guide 🟡
Today the camera shows a generic dashed `GhostGuide` (or the before-photo ghost) regardless of angle —
see [`CameraScreen.js`](../src/screens/CameraScreen.js). To give each pose its own framing guide
(front oval, profile outline, base-view guide), add a small guide component keyed by pose category and
select it from the angle `code` — see §4.

---

## 4. The modular target — a pose registry 🟡

The defaults and (future) guides currently branch on the angle `code` string. As angles multiply, fold
this into a single **pose registry** so angles, overlays, and blur are fully data-driven:

```js
// proposed: src/data/poses.js
export const POSES = {
  front:   { defaultRegions: [bar(0.26,0.36,0.48,0.12)],            guide: 'oval',    redaction: 'blur' },
  oblique: { defaultRegions: [bar(0.30,0.36,0.44,0.12,{rot:4})],    guide: 'oval34',  redaction: 'blur' },
  profile: { defaultRegions: [box(0.46,0.36,0.20,0.12)],            guide: 'profile', redaction: 'blur' },
  base:    { defaultRegions: [],                                    guide: 'base',    redaction: null  },
  // …
};
// each angle in treatments.js declares: pose: 'front' | 'oblique' | 'profile' | 'base' | …
```

Then:
- `defaultEyeBox` becomes `POSES[angle.pose].defaultRegions` — and naturally supports **multiple
  default regions** (e.g. `front` could seed two separate eye blocks instead of one bar).
- The camera renders `guides[POSES[angle.pose].guide]`.
- A pose can pin its own redaction style.

Adding an angle then = one `treatments.js` row + a `pose` tag. Adding a pose = one `POSES` entry
(+ optional guide component). Nothing else changes.

### Multiple blocks 🟢
The renderer and editor already handle `eyeBoxes: Box[]`. In the editor: tap to select, ＋ to add (up
to 4), ✕ to delete — so two independent eye blocks can leave the **nose visible**. The pose registry
above lets a pose seed multiple blocks by default.

### Baking into exports 🟡
In-app redaction is an overlay. Exported/shared social assets are **not** baked yet — a future step
will render the boxes into the composed image at export time (the geometry is already stored).

---

## 5. Verification

In Expo Go or a dev client (`npx expo start`):

1. Capture → the blur is **soft, feathered, rounded**; drag a **corner** to resize both dims, an
   **edge** to resize one dim, two fingers to rotate; rotate then resize — handles still track.
2. **＋ Add** a second block; cover each eye so the **nose shows**; **✕** deletes the selected block.
3. **Settings → Soft / Strong / Pixel / Bar** — each renders and rotates; Strong is clearly more opaque.
4. **Keep** → Timeline / Session Review / Compare show all blocks; **Session Review → align icon →
   Adjust eye cover** edits them later; reload the app → persists (SQLite via `setPhotoEyeBoxes`).
