// ============ NATURE — per-angle capture overlays (alignment guides) ============
// Mirrors defaultEyeBox(): the angle `code` resolves to a guide overlay, with a
// generic dashed fallback that never blocks capture.
//
// Each overlay can carry TWO visuals; the renderer (<GuideOverlay/>) picks in order:
//   1. `src`    — a bundled PNG (full-viewport image). Takes precedence when present.
//   2. `shapes` — normalized SVG primitives drawn in viewport space (always authored
//                 below, so every angle has a fitted guide even with no PNG).
//   3. otherwise → the generic dashed oval.
//
// ADDING A PNG (optional, overrides the SVG for that angle):
//   1. Drop the PNG into  assets/overlays/<file>.png  (see the table).
//   2. Uncomment that overlay's `src:` line. (Metro throws on a require() of a missing
//      file — that's why the requires ship commented.)
//
// `shapes` coordinates are normalized 0..1 of the preview box (viewport space), same
// convention as the doc. Primitive kinds: `ellipse` {cx,cy,rx,ry}, `rect` {x,y,w,h,r?},
// `line` {x1,y1,x2,y2}. Add `dash:true` for a dashed reference line.
//
//   id          file                 angle code(s)                                   used by
//   ----------  -------------------  ----------------------------------------------  ----------------------------
//   front       front.png            FRONT, FRONT/REL, FRONT/SMI, FRONT/NEU,         all treatments
//                                     BROWS, FROWN
//   oblique-l   oblique-l.png        L-45                                            lip, botox, nose, jaw, eye, skin, custom
//   oblique-r   oblique-r.png        R-45                                            lip, botox, nose, jaw, eye, skin
//   profile-l   profile-l.png        L-PROF, PROFILE                                 nose, jaw, lip
//   profile-r   profile-r.png        R-PROF                                          nose
//   base        base.png             BASE                                            nose
//   cheek-l     cheek-l.png          L-CHEEK                                         skin
//   hairline    hairline.png         HAIRLINE                                        hair
//   top         top.png              TOP                                             hair
//   crown       crown.png            CROWN                                           hair
//   donor       donor.png            DONOR                                           hair

export const OVERLAYS = {
  front: {
    id: 'front', label: 'Front', flippable: false,
    src: require('../../assets/overlays/front.png'),
    shapes: [
      { kind: 'ellipse', cx: 0.50, cy: 0.52, rx: 0.23, ry: 0.33 },          // face oval
      { kind: 'line', x1: 0.50, y1: 0.21, x2: 0.50, y2: 0.85, dash: true }, // midline
      { kind: 'rect', x: 0.29, y: 0.40, w: 0.42, h: 0.085, r: 6, dash: true }, // eye band
      { kind: 'line', x1: 0.39, y1: 0.66, x2: 0.61, y2: 0.66, dash: true }, // lip line
    ],
  },
  'oblique-l': {
    id: 'oblique-l', label: 'Left 45°', flippable: true, side: 'L',
    // src: require('../../assets/overlays/oblique-l.png'),
    shapes: [
      { kind: 'ellipse', cx: 0.52, cy: 0.52, rx: 0.22, ry: 0.33 },
      { kind: 'line', x1: 0.44, y1: 0.22, x2: 0.46, y2: 0.84, dash: true }, // midline shifted to near side
      { kind: 'rect', x: 0.30, y: 0.40, w: 0.40, h: 0.085, r: 6, dash: true },
      { kind: 'line', x1: 0.40, y1: 0.50, x2: 0.33, y2: 0.55 },             // nose toward camera-left
      { kind: 'line', x1: 0.40, y1: 0.66, x2: 0.60, y2: 0.66, dash: true },
    ],
  },
  'oblique-r': {
    id: 'oblique-r', label: 'Right 45°', flippable: true, side: 'R',
    // src: require('../../assets/overlays/oblique-r.png'),
    shapes: [
      { kind: 'ellipse', cx: 0.48, cy: 0.52, rx: 0.22, ry: 0.33 },
      { kind: 'line', x1: 0.56, y1: 0.22, x2: 0.54, y2: 0.84, dash: true },
      { kind: 'rect', x: 0.30, y: 0.40, w: 0.40, h: 0.085, r: 6, dash: true },
      { kind: 'line', x1: 0.60, y1: 0.50, x2: 0.67, y2: 0.55 },
      { kind: 'line', x1: 0.40, y1: 0.66, x2: 0.60, y2: 0.66, dash: true },
    ],
  },
  'profile-l': {
    id: 'profile-l', label: 'Left Profile', flippable: true, side: 'L',
    // src: require('../../assets/overlays/profile-l.png'),
    shapes: [
      { kind: 'ellipse', cx: 0.58, cy: 0.50, rx: 0.25, ry: 0.34 },          // head mass (back of head)
      { kind: 'line', x1: 0.40, y1: 0.24, x2: 0.34, y2: 0.40 },             // forehead -> brow
      { kind: 'line', x1: 0.34, y1: 0.40, x2: 0.36, y2: 0.48 },             // brow -> nose bridge
      { kind: 'line', x1: 0.36, y1: 0.48, x2: 0.30, y2: 0.55 },             // bridge -> nose tip
      { kind: 'line', x1: 0.30, y1: 0.55, x2: 0.37, y2: 0.60 },             // nose tip -> upper lip
      { kind: 'line', x1: 0.37, y1: 0.60, x2: 0.39, y2: 0.74 },             // lips -> chin
      { kind: 'ellipse', cx: 0.64, cy: 0.52, rx: 0.035, ry: 0.05, dash: true }, // ear
      { kind: 'line', x1: 0.44, y1: 0.47, x2: 0.50, y2: 0.47, dash: true }, // eye level
    ],
  },
  'profile-r': {
    id: 'profile-r', label: 'Right Profile', flippable: true, side: 'R',
    // src: require('../../assets/overlays/profile-r.png'),
    shapes: [
      { kind: 'ellipse', cx: 0.42, cy: 0.50, rx: 0.25, ry: 0.34 },
      { kind: 'line', x1: 0.60, y1: 0.24, x2: 0.66, y2: 0.40 },
      { kind: 'line', x1: 0.66, y1: 0.40, x2: 0.64, y2: 0.48 },
      { kind: 'line', x1: 0.64, y1: 0.48, x2: 0.70, y2: 0.55 },
      { kind: 'line', x1: 0.70, y1: 0.55, x2: 0.63, y2: 0.60 },
      { kind: 'line', x1: 0.63, y1: 0.60, x2: 0.61, y2: 0.74 },
      { kind: 'ellipse', cx: 0.36, cy: 0.52, rx: 0.035, ry: 0.05, dash: true },
      { kind: 'line', x1: 0.50, y1: 0.47, x2: 0.56, y2: 0.47, dash: true },
    ],
  },
  base: {
    id: 'base', label: 'Base',
    // src: require('../../assets/overlays/base.png'),
    shapes: [
      { kind: 'ellipse', cx: 0.50, cy: 0.50, rx: 0.27, ry: 0.30 },          // foreshortened face (chin up)
      { kind: 'line', x1: 0.50, y1: 0.28, x2: 0.44, y2: 0.58 },             // nose ridge -> L nostril
      { kind: 'line', x1: 0.50, y1: 0.28, x2: 0.56, y2: 0.58 },             // nose ridge -> R nostril
      { kind: 'ellipse', cx: 0.44, cy: 0.60, rx: 0.035, ry: 0.022, dash: true }, // nostril L
      { kind: 'ellipse', cx: 0.56, cy: 0.60, rx: 0.035, ry: 0.022, dash: true }, // nostril R
      { kind: 'line', x1: 0.40, y1: 0.72, x2: 0.60, y2: 0.72, dash: true }, // lips
    ],
  },
  'cheek-l': {
    id: 'cheek-l', label: 'Left Cheek', flippable: true, side: 'L',
    // src: require('../../assets/overlays/cheek-l.png'),
    shapes: [
      { kind: 'ellipse', cx: 0.50, cy: 0.52, rx: 0.24, ry: 0.33 },
      { kind: 'ellipse', cx: 0.39, cy: 0.56, rx: 0.10, ry: 0.13, dash: true }, // cheek region
      { kind: 'line', x1: 0.50, y1: 0.22, x2: 0.50, y2: 0.84, dash: true },
      { kind: 'rect', x: 0.30, y: 0.40, w: 0.40, h: 0.085, r: 6, dash: true },
    ],
  },
  hairline: {
    id: 'hairline', label: 'Hairline',
    // src: require('../../assets/overlays/hairline.png'),
    shapes: [
      { kind: 'ellipse', cx: 0.50, cy: 0.88, rx: 0.33, ry: 0.55 },          // crown arc ≈ hairline near top
      { kind: 'line', x1: 0.17, y1: 0.36, x2: 0.83, y2: 0.36, dash: true }, // hairline reference level
      { kind: 'line', x1: 0.20, y1: 0.62, x2: 0.80, y2: 0.62, dash: true }, // brow reference level
    ],
  },
  top: {
    id: 'top', label: 'Top View',
    // src: require('../../assets/overlays/top.png'),
    shapes: [
      { kind: 'ellipse', cx: 0.50, cy: 0.50, rx: 0.30, ry: 0.38 },          // head from above
      { kind: 'line', x1: 0.50, y1: 0.12, x2: 0.50, y2: 0.88, dash: true }, // part line
      { kind: 'ellipse', cx: 0.50, cy: 0.44, rx: 0.03, ry: 0.03 },          // crown point
    ],
  },
  crown: {
    id: 'crown', label: 'Crown',
    // src: require('../../assets/overlays/crown.png'),
    shapes: [
      { kind: 'ellipse', cx: 0.50, cy: 0.48, rx: 0.30, ry: 0.36 },
      { kind: 'ellipse', cx: 0.50, cy: 0.44, rx: 0.06, ry: 0.06 },          // whorl
      { kind: 'ellipse', cx: 0.50, cy: 0.44, rx: 0.11, ry: 0.11, dash: true }, // whorl outer
      { kind: 'line', x1: 0.22, y1: 0.80, x2: 0.78, y2: 0.80, dash: true }, // nape line
    ],
  },
  donor: {
    id: 'donor', label: 'Donor Area',
    // src: require('../../assets/overlays/donor.png'),
    shapes: [
      { kind: 'ellipse', cx: 0.50, cy: 0.44, rx: 0.30, ry: 0.34 },
      { kind: 'rect', x: 0.20, y: 0.54, w: 0.60, h: 0.20, r: 8, dash: true }, // donor zone band
      { kind: 'line', x1: 0.20, y1: 0.64, x2: 0.80, y2: 0.64, dash: true },  // mid reference
    ],
  },
};

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
