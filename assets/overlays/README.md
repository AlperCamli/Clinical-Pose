# Capture overlays (per-angle alignment guides)

Drop one transparent-background PNG per overlay here, using these **exact filenames**,
then uncomment the matching `src:` line in [`src/data/overlays.js`](../../src/data/overlays.js).
Any overlay without a file falls back to the generic dashed guide automatically.

| File | Angle code(s) | Where it appears |
|---|---|---|
| `front.png`     | `FRONT`, `FRONT/REL`, `FRONT/SMI`, `FRONT/NEU`, `BROWS`, `FROWN` | all treatments — Front / Brows Raised / Frowning |
| `oblique-l.png` | `L-45`            | lip, botox, nose, jaw, eye, skin, custom — Left 45° |
| `oblique-r.png` | `R-45`            | lip, botox, nose, jaw, eye, skin — Right 45° |
| `profile-l.png` | `L-PROF`, `PROFILE` | nose, jaw — Left Profile; lip — Side Profile |
| `profile-r.png` | `R-PROF`          | nose — Right Profile |
| `base.png`      | `BASE`            | nose — Base View |
| `cheek-l.png`   | `L-CHEEK`         | skin — Left Cheek |
| `hairline.png`  | `HAIRLINE`        | hair — Front Hairline |
| `top.png`       | `TOP`             | hair — Top View |
| `crown.png`     | `CROWN`           | hair — Crown |
| `donor.png`     | `DONOR`           | hair — Donor Area |

## Authoring guidance

- **Format:** PNG with a transparent background (only the guide lines are visible).
- **Orientation:** portrait, matching the live-preview area; light/blue line-art works best
  over the camera feed.
- **Resolution:** generous (≈1080×1440 or larger) so the guide stays crisp.
- **Fit:** rendered with `resizeMode="contain"` (aspect preserved, centered), so the image
  does not need to match any specific device aspect ratio.
- **Left/Right:** files ending `-l` / `-r` are mirrored automatically on the front camera so
  left/right still read correctly.
