# Nature — Social Media Content Creation

How Nature turns a client's before/after clinical photos into a **privacy-safe, shareable social
asset**, and the implementation plan to take the Create-Post wizard from *mock* to *real*.

> **Status legend**
> - 🟢 **Implemented** — exists in code today.
> - 🟡 **To build** — the agreed target; this document is the spec.
> - 🔴 **Not implemented** — part of the spec but deliberately deferred; not built yet.
>
> Today the wizard navigates, lets the doctor pick format/template/privacy, and **enforces social
> consent** — but every preview draws the placeholder subject (no real photo), and **Save / Share
> only fire toasts**. There is no path yet that renders the composed layout to an image file. This
> doc closes that gap.

---

## 1. The flow 🟢 (navigation) / 🟢 (content)

A 4-step wizard + export screen. Entered from Timeline, a session card, or the Compare screen's
"Create social post" CTA — all call `nav.go('postSelect', { cid, caseId })`.

| Report | Screen | File | Today |
|---|---|---|---|
| S15 | Select photos | [`PostSelectScreen.js`](../src/screens/PostSelectScreen.js) | 🟢 picks angles + mode · 🟡 placeholder thumbs, no real before/after |
| S16 | Format | [`PostFormatScreen.js`](../src/screens/PostFormatScreen.js) | 🟢 sets `1:1 / 4:5 / 9:16` |
| S17 | Template | [`PostTemplateScreen.js`](../src/screens/PostTemplateScreen.js) | 🟢 sets `split / slider / timeline / single` |
| S18 | Privacy | [`PostPrivacyScreen.js`](../src/screens/PostPrivacyScreen.js) | 🟢 toggles + **consent gate** |
| S19 | Export / Share | [`PostExportScreen.js`](../src/screens/PostExportScreen.js) | 🟢 Save / Share are toasts |
| — | Shared renderer | [`PostPreview.js`](../src/components/PostPreview.js) | 🟡 placeholder subject everywhere |
| — | Wizard shell | [`Wizard.js`](../src/components/Wizard.js) | 🟢 |

The config is threaded through navigation params only (never persisted), accreting one field per
step — see §3.

---

## 2. What's mock vs real (be precise)

- **Wizard scaffolding, step state, consent gate** → 🟢 real and correct. `PostPrivacyScreen`
  blocks Export when `!c.consentSocial` and offers an inline "Record consent now" (`store.setConsent`).
- **`PostPreview.js`** → 🟡 every template renders `<Photo variant="plain" />` (the abstract subject).
  It receives `c` / `cs` for the meta line, but **no resolved before/after images**.
- **`PostSelectScreen`** → 🟡 the per-angle cards render two placeholder photos and a hardcoded
  `BEFORE → AFTER`. It selects **angle ids** but never resolves them to real sessions/photos.
- **`PostExportScreen`** → 🟡 `Save to gallery` / `Share` call `toast(...)`. Nothing is rendered to
  a file; nothing reaches the gallery or the share sheet.

Everything downstream of `PostPreview` (format/template/privacy previews) becomes real **for free**
the moment `PostPreview` is fed real images — they all just embed `<PostPreview>`.

---

## 3. The config object (`cfg`) 🟢 shape / 🟡 semantics to finalize

Built up across the wizard and passed in `route.params.cfg`:

```js
cfg = {
  sel:      string[],                       // selected angle ids (PostSelect)
  mode:     'single' | 'carousel' | 'timeline',   // how many slides
  format:   '1:1' | '4:5' | '9:16',         // aspect ratio (PostFormat)
  template: 'split' | 'slider' | 'timeline' | 'single', // per-slide layout (PostTemplate)
  privacy:  { eyes:'hidden'|'visible', name, treatment, date, logo, doctor, disclaimer }, // booleans
}
```

**Clarify `mode` vs `template`** (they currently overlap and confuse):
- `template` = the **layout of one slide** (the thing `PostPreview` draws).
- `mode` = **how many slides** the export produces:
  - `single` → one slide for `sel[0]` (or the single chosen angle).
  - `carousel` → one slide **per** selected angle (multi-image post / IG carousel) → §9.
  - `timeline` → one slide whose template is forced to `timeline` (all chosen sessions in a row).

🟡 **Decision to lock before coding:** keep both, or collapse `mode` into `template` (treat
`carousel` as "repeat the chosen template across `sel`"). Recommendation: keep `mode` as the
slide-count axis and `template` as the layout axis; have `PostExport` loop `sel` when
`mode === 'carousel'`.

---

## 4. Resolving real images (reuse the Compare logic)

A post slide needs, **per angle**, a *before* photo and an *after* photo. This is exactly what the
Compare screen now does ([`CompareScreen.js`](../src/screens/CompareScreen.js)): the pool for an
angle is every session that captured it, chronological; earliest = BEFORE, latest = AFTER.

**Extract the shared query into a helper** so Compare and Post agree:

```js
// src/data/helpers.js
export function capturedSessions(cs, angleId) {
  return cs.sessions.filter((s) => s.photos[angleId]?.status === 'captured');
}
export function beforeAfter(cs, angleId) {
  const ss = capturedSessions(cs, angleId);          // oldest → newest
  return { before: ss[0], after: ss[ss.length - 1] };
}
```

Then `CompareScreen` reuses `capturedSessions`, and the post path uses `beforeAfter`. A `<Photo>`
takes the stored geometry directly: `{ uri, eyeBoxes, imgW, imgH }` from `session.photos[angleId]`.

> **Note on demo data.** Seed photos are `status:'captured'` but carry **no `uri`**, so previews
> show the placeholder subject — acceptable; the wiring is identical for real device captures.
> A meaningful post needs ≥1 before and ≥1 after session captured for the angle.

🔴 **Optional parity with Compare:** let `PostSelect` reuse Compare's "pick which 2 images" strip so
the doctor can override the default before/after when an angle has >2 sessions, storing the chosen
session ids in `cfg` (e.g. `cfg.pairs = { [angleId]: [beforeSid, afterSid] }`). Otherwise default to
`beforeAfter()`.

---

## 5. `PostPreview` — wire real images + **bake redaction** 🟡

Change `PostPreview` to resolve images from `(c, cs, cfg)` instead of drawing placeholders. Signature
stays `PostPreview({ cfg, t, c, cs, size })`; internally:

```js
const angleId = cfg.sel?.[0] ?? reqAngles(cs.treatment)[0].id;
const { before, after } = beforeAfter(cs, angleId);
const ph = (s) => { const p = s?.photos[angleId]; return { uri: p?.uri, eyeBoxes: p?.eyeBoxes, imgW: p?.imgW, imgH: p?.imgH }; };
const eye = cfg.privacy?.eyes !== 'visible';   // already computed today
```

Per template:
- **split** → left `<Photo {...ph(before)} eyeHidden={eye} />`, right `<Photo {...ph(after)} eyeHidden={eye} />`.
- **slider** → base = `ph(before)`, revealed half = `ph(after)` (same structure already there).
- **timeline** → map `capturedSessions(cs, angleId)` (or `cfg`-selected sessions) instead of `[0,1,2]`.
- **single** → `ph(after)` (the result shot).

`eyeHidden={eye}` drives `<Photo>`'s existing redaction overlay. **Because the exported file is a
snapshot of this very component (§6), the blur/bar/pixel is baked into the asset** — this closes the
🟡 "Baking into exports" item in [`eye-redaction.md`](./eye-redaction.md#4-the-modular-target--a-pose-registry-). When `cfg.privacy.eyes === 'visible'` and `c.consentSocial`,
no overlay is drawn (intentional).

Also honor the meta toggles already half-present: render `c.name` when `privacy.name`, treatment
name when `privacy.treatment`, date range when `privacy.date`, the **practitioner** (`cs.practitioner`)
when `privacy.doctor` (currently unrendered), logo when `privacy.logo`, and the disclaimer banner when
`privacy.disclaimer`.

---

## 6. Rendering the asset to a file (the core new capability) 🟡

`PostPreview` is a React view; export = **snapshot that view tree to a PNG/JPG file**. Use
[`react-native-view-shot`](https://github.com/gre/react-native-view-shot) (`captureRef`).

> **Native module → dev client required.** Like ML Kit, `react-native-view-shot` is not in Expo Go;
> capture only runs in a custom dev client (`npx expo prebuild && npx expo run:ios|android`). In Expo
> Go, gate the Save/Share buttons behind a `Platform`/availability check and keep the toast fallback
> so the flow stays walkable. Mirrors the guard pattern in [`faceDetection.js`](../src/data/faceDetection.js).

**Hi-res offscreen render.** The on-screen preview is ~180–260 px; social assets want 1080-px-class
output. Render a **second, full-size `PostPreview` offscreen** (positioned off the layout or at
`opacity:0` / absolute far-left) sized to the target pixels, and capture *that* — so the visible UI
stays small while the file is crisp.

```js
import { captureRef } from 'react-native-view-shot';

const PX = { '1:1': [1080, 1080], '4:5': [1080, 1350], '9:16': [1080, 1920] };
const [w, h] = PX[cfg.format];

const shotRef = useRef(null);
// offscreen: <View style={{ position:'absolute', left:-9999 }}>
//              <View collapsable={false} ref={shotRef}><PostPreview cfg={cfg} size={w} c={c} cs={cs} t={t} /></View>
//            </View>
async function renderAsset() {
  return captureRef(shotRef, { format: 'jpg', quality: 0.95, width: w, height: h, result: 'tmpfile' });
  // → returns a file:// uri in cache
}
```

`PostPreview` already derives height from `size / ratio`, so passing `size={w}` yields the right
pixel box; `captureRef`'s `width/height` pins the output resolution.

> **Alternative (deferred):** `@shopify/react-native-skia` offscreen `Surface.makeImageSnapshot()`
> gives pixel-exact, layout-independent rendering (good for server-grade output) but is a heavier
> dependency and a rewrite of `PostPreview` in Skia primitives. `view-shot` reuses the existing RN
> tree and is the pragmatic first cut.

---

## 7. Save to gallery 🟡

Reuse the media-library pattern already proven in [`photos.js`](../src/data/photos.js) (SDK-56
class API: `Asset.create` / `Album.get` / `Album.create`). Put exports in their **own album** so
they never mix with clinical originals:

```js
// src/data/posts.js  (new — sibling of photos.js)
import { Asset, Album, requestPermissionsAsync } from 'expo-media-library';
const POST_ALBUM = 'Nature Posts';

export async function savePostToGallery(fileUri) {
  const { granted } = await requestPermissionsAsync();
  if (!granted) throw new Error('no-media-permission');
  const album = await Album.get(POST_ALBUM);
  if (album) await Asset.create(fileUri, album);
  else await Album.create(POST_ALBUM, [fileUri]);
}
```

Wire `PostExportScreen`'s **Save to gallery** → `renderAsset()` → `savePostToGallery(uri)` →
`toast('Saved to gallery')`; surface a clear error toast if permission is denied.

> **PHI / consent.** Unlike clinical originals (eyes-visible by design), the social asset is the
> **redacted, consented** composite. Saving it to the gallery (which may iCloud/Google-sync) is
> acceptable *because* it is privacy-safe and consent-gated. Still expose this album choice to clinic
> policy later (same caveat as the §4 PHI note in [`data-model.md`](./data-model.md#4-photo-storage-)).

---

## 8. Share 🟡

Add [`expo-sharing`](https://docs.expo.dev/versions/v56.0.0/sdk/sharing/) and share the rendered
file via the system sheet:

```js
import * as Sharing from 'expo-sharing';
async function sharePost(fileUri) {
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(fileUri, { mimeType: 'image/jpeg' });
}
```

Wire **Share** → `renderAsset()` → `sharePost(uri)`. (Fallback: React Native's built-in `Share` with
`{ url: fileUri }` on iOS — but `expo-sharing` is cross-platform and Expo-idiomatic.)

---

## 9. Carousel / multi-slide export 🟡

When `cfg.mode === 'carousel'`, the post is one slide **per** selected angle:

- **Save:** loop `cfg.sel`, render each angle's `PostPreview` (override `cfg.sel = [angleId]` per
  pass) → save each file to `Nature Posts`. Toast `Saved 4 images`.
- **Share:** `Sharing.shareAsync` shares one file; for multi-image, either share the first and toast
  "saved the set to gallery", or defer multi-file share. Keep §9 simple in v1: **carousel saves N
  files; share posts the first** (note this limitation in the UI).
- **Preview UX:** `PostExportScreen` should show the N slides (horizontal pager/scroll) so the doctor
  sees the whole set before saving.

`single` and `timeline` modes produce **one** file.

---

## 10. Privacy, consent & redaction (invariants) 🟢/🟡

- **Consent gate** 🟢 — Export stays blocked until `c.consentSocial`; do **not** weaken it. The
  render/save/share helpers should also assert `c.consentSocial` defensively.
- **Redaction baked** 🟡 — guaranteed by §5+§6: the snapshot includes `<Photo>`'s overlay, so eyes
  are hidden *in the pixels*, not just on screen. Verify the box lands correctly under `cover` at the
  export aspect ratio (the geometry is normalized, so it should — but confirm 9:16 crops).
- **Eyes visible** — only when `privacy.eyes === 'visible'`; pair it with the consent gate so a
  visible-eyes asset can't be produced without social consent.
- **Originals untouched** 🟢 — export reads `localUri` originals and composites; it never rewrites them.

---

## 11. Dependencies to add 🟡

```bash
cd nature
npx expo install react-native-view-shot expo-sharing
npx expo prebuild         # regenerate native projects (view-shot is native)
npx expo run:ios          # or run:android — rebuild the dev client
```

- `react-native-view-shot` — capture the composed view → image file (§6). Autolinked; no config
  plugin. **Not in Expo Go** → dev client.
- `expo-sharing` — system share sheet (§8). Ships in the dev client.
- `expo-media-library` — already a dependency (§7).

Per [`AGENTS.md`](../AGENTS.md), confirm exact versions against the **SDK 56** docs
(`https://docs.expo.dev/versions/v56.0.0/`) before wiring; `expo install` picks the compatible pins.

---

## 12. Files to touch

| Concern | File | Change |
|---|---|---|
| Before/after resolution | [`src/data/helpers.js`](../src/data/helpers.js) | add `capturedSessions`, `beforeAfter` (reuse in Compare) |
| Real images + baked redaction | [`src/components/PostPreview.js`](../src/components/PostPreview.js) | resolve `ph(before/after)`, render meta toggles incl. `doctor` |
| Real before/after thumbs | [`src/screens/PostSelectScreen.js`](../src/screens/PostSelectScreen.js) | feed real `<Photo>`; optional 2-image picker → `cfg.pairs` |
| Gallery save | `src/data/posts.js` *(new)* | `savePostToGallery` (mirrors `photos.js`) |
| Render + save + share + carousel | [`src/screens/PostExportScreen.js`](../src/screens/PostExportScreen.js) | offscreen hi-res `PostPreview` + `captureRef`; wire buttons |
| Deps | [`package.json`](../package.json) | `react-native-view-shot`, `expo-sharing` |

`PostFormat` / `PostTemplate` / `PostPrivacy` need **no changes** — their previews update automatically
once `PostPreview` takes real images.

---

## 13. Verification

In a **dev client** (`npx expo run:ios` — capture needs native modules):

1. Capture a baseline **before** and ≥1 **after** session for a consented client (Ayşe K. → Lip
   Filler already has 2 sessions; on device, capture real photos so `uri`s exist).
2. Timeline → **Create social post**. PostSelect shows the **real** before/after pair per angle.
3. Format / Template / Privacy previews show **real** images; toggle **Eyes hidden/visible**,
   `Treatment`, `Date`, `Doctor`, `Disclaimer` and watch the asset update.
4. **Privacy gate:** a client with `consentSocial:false` (Mert Y.) blocks Export; "Record consent
   now" unblocks it.
5. **Export → Save to gallery:** the composed asset lands in the **Nature Posts** album, with the
   **eyes baked-blurred** (open the saved file, confirm the redaction is in the pixels). Deny the
   permission once → graceful error toast.
6. **Export → Share:** the system share sheet opens with the rendered image.
7. **Carousel:** select multiple angles, `mode:carousel` → N files saved; preview pages through them.
8. **Format crops:** 9:16 vs 1:1 vs 4:5 — output resolution is 1080-class and the redaction box still
   lands on the eyes after the crop.
9. **Expo Go fallback:** Save/Share show the toast (no crash) since `view-shot` is unavailable.
10. `npx expo export` bundles clean.

---

## 14. Out of scope (later phases)

- **Persisting that a post was exported** (an `exports` table / audit) — today `cfg` is transient
  (see [`data-model.md`](./data-model.md#6-transient-not-persisted--social-post-config-)).
- **Captions / hashtags / brand kit**, multi-file native share, and server-side hi-fidelity rendering
  (Skia/serverless) for consistent cross-device output.
- **Video** (animated slider reveal / timeline) export.
