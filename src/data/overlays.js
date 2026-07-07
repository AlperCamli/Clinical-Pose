// ============ NATURE — per-angle capture overlays (registry + resolver) ============
// Mirrors defaultEyeBox(): the angle `code` resolves to a guide overlay, with a
// generic fallback that never blocks capture.
//
// Geometry lives in ./overlayShapes.js (pure data, shared with the browser preview
// generator). This file just wires optional PNG sources onto those defs and exposes
// the resolver. Render precedence in <GuideOverlay/>: PNG `src` → SVG `shapes` →
// generic oval.
//
// ADDING A PNG (optional — overrides the SVG guide for that angle):
//   1. Drop the PNG into  assets/overlays/<id>.png
//   2. Uncomment its line in SRC below. (Metro throws on a require() of a missing
//      file — that's why the requires ship commented.)

import { OVERLAY_DEFS, DESIGN } from './overlayShapes';

export { DESIGN };

// Optional bundled PNGs, keyed by overlay id. A present entry overrides the SVG shapes.
const SRC = {
  front: require('../../assets/overlays/front.png'),
  // 'oblique-l': require('../../assets/overlays/oblique-l.png'),
  // 'oblique-r': require('../../assets/overlays/oblique-r.png'),
  // 'profile-l': require('../../assets/overlays/profile-l.png'),
  // 'profile-r': require('../../assets/overlays/profile-r.png'),
  // base: require('../../assets/overlays/base.png'),
  // 'cheek-l': require('../../assets/overlays/cheek-l.png'),
  // hairline: require('../../assets/overlays/hairline.png'),
  // top: require('../../assets/overlays/top.png'),
  // crown: require('../../assets/overlays/crown.png'),
  // donor: require('../../assets/overlays/donor.png'),
};

export const OVERLAYS = Object.fromEntries(
  Object.entries(OVERLAY_DEFS).map(([id, def]) => [id, SRC[id] ? { ...def, src: SRC[id] } : def]),
);

// The universal safety net: a guide with no `src` and no `shapes` renders as the dashed oval.
export const GENERIC = { id: 'generic', label: 'Generic' };

// code → overlay id. Order matters (PROFILE before 45, etc.); `side` picks L/R.
const RULES = [
  [/PROF|PROFILE/, (side) => `profile-${side}`],
  [/CHEEK/,        (side) => `cheek-${side}`],
  [/45/,           (side) => `oblique-${side}`],
  [/BASE/,         () => 'base'],
  [/HAIRLINE/,     () => 'hairline'],
  [/CROWN/,        () => 'crown'],
  [/TOP/,          () => 'top'],
  [/DONOR/,        () => 'donor'],
];

// Resolve the alignment overlay for an angle. Mirrors defaultEyeBox(angle):
// explicit `overlayId` override, else regex on the (shared) angle `code`.
export function resolveOverlay(angle) {
  if (angle?.overlayId) return OVERLAYS[angle.overlayId] || GENERIC;
  const code = (angle?.code || '').toUpperCase();
  if (!code) return OVERLAYS.front || GENERIC;
  const side = code.startsWith('R') ? 'r' : 'l'; // best-effort; PROFILE → l
  for (const [re, pick] of RULES) if (re.test(code)) return OVERLAYS[pick(side)] || GENERIC;
  return OVERLAYS.front || GENERIC; // FRONT*, BROWS, FROWN, anything face-on
}
