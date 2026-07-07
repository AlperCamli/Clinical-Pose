// ============ NATURE — overlay shape definitions (pure data) ============
// Per-angle alignment-guide geometry, authored in a fixed DESIGN space so the
// SAME data renders identically in the app (<GuideOverlay/>) and in the browser
// preview (scripts/render-overlays.mjs).
//
// IMPORTANT: keep this file pure data — NO imports / require(). The preview
// generator loads it by eval, so anything beyond plain JS data + local consts
// will break it.
//
// Coordinate space: 0..W (x, → right) × 0..H (y, ↓ down). The app scales the
// design box to COVER the camera viewport (same crop as the preview itself), so
// on tall screens the top/bottom design margins fall outside the frame — keep
// critical geometry inside the central band. Strokes use
// vector-effect:non-scaling so strokeWidth/dash are in screen px regardless of
// box size.
//
// Primitive kinds:
//   { kind:'ellipse', cx,cy,rx,ry, rot? }
//   { kind:'rect',    x,y,w,h, r?, rot? }
//   { kind:'line',    x1,y1,x2,y2 }
//   { kind:'path',    d }                 // SVG path data in DESIGN coords
// Optional per-shape style: `soft:true` (thinner/dimmer), `dash:true` (dashed).
//
// An overlay def: { id, label, flippable?, side?, flipX?, cal?, shapes }.
// `flipX:true` renders `shapes` mirrored across the vertical center — used so the
// -r variants reuse the -l geometry exactly (no hand-mirrored path strings).
// `cal: { scale?, dx?, dy? }` is an optional per-overlay calibration transform
// (design units, scale about the design center) for on-device fit tuning after
// the cover change — rendered by GuideOverlay AND scripts/render-overlays.mjs.

export const DESIGN = { W: 1000, H: 1400 };

const CX = 500;

// Shared front-face landmark band (crown→chin) used to keep front/oblique/cheek
// consistent: crown ≈230, brow ≈560, eye-line ≈625, nose-base ≈790, mouth ≈895,
// chin ≈1085. Head half-width ≈265.

// ---- Front (face-on). Mostly a fallback; front.png overrides it. ----
const FRONT = [
  // head: egg — wider cranium tapering to a rounded chin (path, not a bare ellipse)
  { kind: 'path', d: 'M500,232 C640,232 742,360 752,560 C758,700 720,860 640,985 C580,1078 540,1098 500,1098 C460,1098 420,1078 360,985 C280,860 242,700 248,560 C258,360 360,232 500,232 Z' },
  { kind: 'line', x1: CX, y1: 300, x2: CX, y2: 1010, soft: true, dash: true },      // midline
  // brows
  { kind: 'path', d: 'M312,556 C360,536 430,538 472,558', soft: true },            // L brow
  { kind: 'path', d: 'M528,558 C570,538 640,536 688,556', soft: true },            // R brow
  // eyes (almonds) + irises
  { kind: 'path', d: 'M318,628 C362,602 438,602 478,628 C438,658 362,658 318,628 Z', soft: true }, // L eye
  { kind: 'path', d: 'M522,628 C562,602 638,602 682,628 C638,658 562,658 522,628 Z', soft: true }, // R eye
  { kind: 'ellipse', cx: 398, cy: 630, rx: 17, ry: 17 },                            // L iris
  { kind: 'ellipse', cx: 602, cy: 630, rx: 17, ry: 17 },                            // R iris
  // nose: dorsum + tip + alae
  { kind: 'path', d: 'M500,612 L500,772', soft: true },                            // dorsum
  { kind: 'path', d: 'M452,786 C470,810 530,810 548,786', soft: true },            // tip / columella base
  { kind: 'path', d: 'M448,786 C436,742 446,712 462,700', soft: true },            // L ala
  { kind: 'path', d: 'M552,786 C564,742 554,712 538,700', soft: true },            // R ala
  // lips
  { kind: 'path', d: 'M420,892 C456,872 544,872 580,892 C544,930 456,930 420,892 Z' }, // lips
  { kind: 'line', x1: 420, y1: 892, x2: 580, y2: 892, soft: true },                // commissure
  { kind: 'path', d: 'M470,838 C486,830 514,830 530,838', soft: true },            // cupid's bow / philtrum base
];

// ---- Oblique / 45° three-quarter (face turned so the nose points to the LEFT). ----
// A real 3/4: the far (right) cheek is one smooth convex contour; the near (left)
// side carries the profile (forehead→nose bump→lip→chin). One nose, two asymmetric
// eyes (near larger/frontal, far smaller/compressed toward the bridge).
const OBLIQUE_L = [
  // outer head + face contour (one closed silhouette)
  { kind: 'path', d: [
      'M534,226',
      'C652,236 742,398 762,556',          // crown → far (right) cheekbone
      'C772,676 750,846 696,944',          // far cheek → far jaw
      'C656,1008 558,1058 482,1052',       // jaw → chin (left of centre, rounded)
      'C456,1028 436,998 430,966',         // chin underside → labiomental (near side)
      'C434,938 440,912 436,890',          // → lower lip (tucked, near edge)
      'C426,870 422,850 430,830',          // → upper lip / stomion
      'C436,808 428,792 410,786',          // → subnasale
      'C372,792 330,800 304,776',          // → near ala / under-nose, bulging left
      'C300,738 316,702 330,688',          // → nose tip (profile bump)
      'C354,646 354,604 362,556',          // → nasal bridge up to nasion (near)
      'C372,420 404,280 466,242',          // → forehead (rounded)
      'C490,226 514,222 534,226 Z',        // → back to crown
    ].join(' ') },
  // sagittal midline (bows toward the near/left side)
  { kind: 'path', d: 'M468,300 C414,500 372,648 360,704 C374,830 430,952 462,1012', soft: true, dash: true },
  // brows (near larger/outboard; far higher & shorter, foreshortened)
  { kind: 'path', d: 'M348,566 C392,548 454,550 502,570', soft: true },            // near brow
  { kind: 'path', d: 'M566,584 C606,572 660,576 698,594', soft: true },            // far brow
  // eyes (near wide & open; far small & compressed near the bridge)
  { kind: 'path', d: 'M356,632 C398,608 472,608 514,632 C472,660 398,660 356,632 Z', soft: true }, // near eye
  { kind: 'path', d: 'M580,644 C610,626 662,626 690,644 C662,662 610,662 580,644 Z', soft: true }, // far eye
  { kind: 'ellipse', cx: 438, cy: 634, rx: 17, ry: 17 },                            // near iris
  { kind: 'ellipse', cx: 632, cy: 646, rx: 13, ry: 13 },                            // far iris
  // nose detail: near ala/nostril sill + far ala hint
  { kind: 'path', d: 'M312,772 C336,786 368,784 388,772', soft: true },            // near nostril sill
  { kind: 'path', d: 'M452,766 C474,782 506,782 524,768', soft: true },            // far ala hint
  // nasolabial fold (near side)
  { kind: 'path', d: 'M360,788 C366,826 378,860 400,886', soft: true },
  // mouth (near corner tucked at the profile edge; recedes to the far side)
  { kind: 'path', d: 'M446,892 C486,874 528,876 560,892 C528,914 486,916 446,900', soft: true },
];

// ---- Profile (full lateral, facing LEFT; nose at small x). ----
const PROFILE_L = [
  // head silhouette: vertex → forehead → nose → lips → chin → jaw → gonion → ear-back → occiput
  { kind: 'path', d: [
      'M540,212',
      'C468,212 426,240 406,304',          // vertex → forehead front
      'C382,380 374,464 392,548',          // forehead → glabella
      'C396,566 390,582 384,598',          // → nasion (slight dip)
      'C366,650 340,676 316,694',          // → nasal dorsum → tip
      'C332,714 372,728 400,736',          // → under-tip → subnasale
      'C406,762 400,786 394,802',          // → philtrum / upper-lip vermilion
      'C390,812 398,820 404,826',          // → stomion
      'C412,838 402,856 396,866',          // → lower lip
      'C394,888 414,900 430,906',          // → labiomental crease
      'C422,930 416,952 420,974',          // → chin (pogonion)
      'C424,996 444,1008 470,1014',        // → menton (bottom of chin)
      'C548,1030 624,1012 676,966',        // → mandible back to gonion
      'C708,932 720,872 716,806',          // → posterior ramus
      'C714,742 722,676 722,608',          // → behind ear / mastoid
      'C722,524 714,444 692,376',          // → occiput
      'C670,308 612,248 540,212 Z',        // → back of crown → vertex
    ].join(' ') },
  // neck (front + back), continuing the silhouette downward
  { kind: 'path', d: 'M474,1014 C466,1086 470,1150 478,1206' },
  { kind: 'path', d: 'M704,944 C712,1040 706,1130 700,1206' },
  // ear (in front of the ramus)
  { kind: 'path', d: 'M612,700 C664,706 682,772 660,826 C648,858 618,860 610,838 C604,822 612,812 610,798 C588,786 590,722 612,700 Z', soft: true },
  // eye (almond) + iris, set back behind the nose
  { kind: 'path', d: 'M356,634 C380,618 412,618 432,632 C412,648 380,650 356,634 Z', soft: true },
  { kind: 'ellipse', cx: 394, cy: 632, rx: 13, ry: 13 },
  // brow
  { kind: 'path', d: 'M348,592 C376,576 410,578 436,592', soft: true },
  // lip seam (mouth corner back from the stomion)
  { kind: 'path', d: 'M398,820 C422,826 450,824 474,814', soft: true },
  // Frankfort horizontal reference (orbitale → porion / top of ear canal)
  { kind: 'line', x1: 356, y1: 658, x2: 672, y2: 658, soft: true, dash: true },
];

// ---- Base / submental (chin up: jaw nearest/widest at bottom, forehead receding). ----
const BASE = [
  // foreshortened face: narrow receding forehead at top, widest at the jaw (bottom)
  { kind: 'path', d: [
      'M500,372',
      'C448,376 416,432 404,520',          // forehead (small) → temple
      'C390,610 360,694 340,778',          // temple → cheek
      'C320,872 342,978 410,1040',         // cheek → jaw (widening)
      'C452,1080 548,1080 590,1040',       // jaw bottom (widest, nearest)
      'C658,978 680,872 660,778',          // → far cheek
      'C640,694 610,610 596,520',          // → far temple
      'C584,432 552,376 500,372 Z',        // → forehead
    ].join(' ') },
  // nose projecting toward camera: receding dorsum, tip ridge, columella, alae, nostrils
  { kind: 'line', x1: CX, y1: 452, x2: CX, y2: 566, soft: true, dash: true },       // receding dorsum
  { kind: 'path', d: 'M430,648 C452,566 548,566 570,648', soft: true },            // nasal tip ridge
  { kind: 'line', x1: CX, y1: 612, x2: CX, y2: 690, soft: true },                  // columella
  { kind: 'ellipse', cx: 442, cy: 678, rx: 52, ry: 30, rot: -24 },                 // L nostril
  { kind: 'ellipse', cx: 558, cy: 678, rx: 52, ry: 30, rot: 24 },                  // R nostril
  { kind: 'path', d: 'M398,706 C452,748 548,748 602,706', soft: true },            // alar base
  // lips
  { kind: 'path', d: 'M410,902 C470,880 530,880 590,902 C530,928 470,928 410,902 Z' },
  { kind: 'line', x1: 410, y1: 902, x2: 590, y2: 902, soft: true },                // commissure
];

// ---- Cheek (skin, face-on with the near/left cheek plane called out). ----
const CHEEK_L = [
  // clean face oval (same proportions as front)
  { kind: 'path', d: 'M500,236 C636,236 736,362 746,560 C752,700 716,858 638,982 C580,1072 540,1092 500,1092 C460,1092 420,1072 362,982 C284,858 248,700 254,560 C264,362 364,236 500,236 Z' },
  { kind: 'line', x1: CX, y1: 300, x2: CX, y2: 1010, soft: true, dash: true },      // midline
  // near (left) cheek / malar assessment zone
  { kind: 'ellipse', cx: 360, cy: 784, rx: 98, ry: 128, rot: -6, soft: true, dash: true },
  // cheekbone → jaw contour (near side)
  { kind: 'path', d: 'M322,640 C300,752 330,876 448,930', soft: true },
  // eyes (light, for orientation)
  { kind: 'path', d: 'M318,628 C362,604 438,604 478,628 C438,656 362,656 318,628 Z', soft: true },
  { kind: 'path', d: 'M522,628 C562,604 638,604 682,628 C638,656 562,656 522,628 Z', soft: true },
  { kind: 'ellipse', cx: 398, cy: 630, rx: 15, ry: 15 },
  { kind: 'ellipse', cx: 602, cy: 630, rx: 15, ry: 15 },
  // nose + mouth hints
  { kind: 'path', d: 'M500,612 L500,772', soft: true },
  { kind: 'path', d: 'M452,786 C470,808 530,808 548,786', soft: true },
  { kind: 'path', d: 'M420,892 C456,874 544,874 580,892', soft: true },
];

// ---- Hair: front hairline (frames the upper face; the hairline is the subject). ----
const HAIRLINE = [
  // scalp/forehead dome (top of head)
  { kind: 'path', d: 'M196,556 C236,300 764,300 804,556', soft: true },
  // hairline — the key guide: gentle curve with temple recessions + slight central peak
  { kind: 'path', d: 'M210,560 C300,470 360,470 392,512 C430,470 570,470 608,512 C640,470 700,470 790,560', dash: true },
  // temple side-burn drops
  { kind: 'path', d: 'M210,560 C206,640 210,706 222,760', soft: true },
  { kind: 'path', d: 'M790,560 C794,640 790,706 778,760', soft: true },
  // brow reference + face midline
  { kind: 'line', x1: 286, y1: 848, x2: 714, y2: 848, soft: true, dash: true },
  { kind: 'line', x1: CX, y1: 470, x2: CX, y2: 980, soft: true, dash: true },
];

// ---- Hair: top-down (vertex / part line / whorl). Forehead toward top of frame. ----
const TOP = [
  // head from above: narrower at the face (top) widening to the occiput (bottom)
  { kind: 'path', d: 'M500,210 C636,224 726,420 726,700 C726,956 632,1190 500,1190 C368,1190 274,956 274,700 C274,420 364,224 500,210 Z' },
  { kind: 'line', x1: CX, y1: 250, x2: CX, y2: 1150, soft: true, dash: true },      // part line
  // crown whorl: point + spiral
  { kind: 'ellipse', cx: CX, cy: 700, rx: 22, ry: 22 },
  { kind: 'path', d: 'M500,678 C540,678 556,712 540,742 C522,772 482,766 472,738 C462,712 480,690 500,690', soft: true }, // whorl spiral
  { kind: 'ellipse', cx: CX, cy: 700, rx: 150, ry: 150, soft: true, dash: true },   // whorl field
];

// ---- Hair: crown / whorl (back-top of head). ----
const CROWN = [
  { kind: 'ellipse', cx: CX, cy: 660, rx: 300, ry: 500 },
  { kind: 'ellipse', cx: CX, cy: 600, rx: 30, ry: 30 },                            // whorl centre
  { kind: 'path', d: 'M500,572 C556,572 580,624 558,668 C534,712 476,704 462,662 C450,624 478,592 506,592', soft: true }, // whorl spiral
  { kind: 'ellipse', cx: CX, cy: 600, rx: 132, ry: 132, soft: true, dash: true },  // whorl field
  { kind: 'path', d: 'M500,600 C574,632 614,716 606,816', soft: true },            // hair stream
  { kind: 'line', x1: 220, y1: 1130, x2: 780, y2: 1130, soft: true, dash: true },  // nape line
];

// ---- Hair: donor zone (occipital / parietal band). ----
const DONOR = [
  { kind: 'ellipse', cx: CX, cy: 620, rx: 300, ry: 476 },
  { kind: 'path', d: 'M196,742 C360,700 640,700 804,742 C788,860 788,964 804,1058 C640,1100 360,1100 196,1058 C212,964 212,860 196,742 Z', dash: true }, // donor band (wraps)
  { kind: 'line', x1: 220, y1: 900, x2: 780, y2: 900, soft: true, dash: true },    // mid reference
];

export const OVERLAY_DEFS = {
  front:       { id: 'front',     label: 'Front',         flippable: false, shapes: FRONT },
  'oblique-l': { id: 'oblique-l', label: 'Left 45°',      flippable: true, side: 'L', shapes: OBLIQUE_L },
  'oblique-r': { id: 'oblique-r', label: 'Right 45°',     flippable: true, side: 'R', flipX: true, shapes: OBLIQUE_L },
  'profile-l': { id: 'profile-l', label: 'Left Profile',  flippable: true, side: 'L', shapes: PROFILE_L },
  'profile-r': { id: 'profile-r', label: 'Right Profile', flippable: true, side: 'R', flipX: true, shapes: PROFILE_L },
  base:        { id: 'base',      label: 'Base',          shapes: BASE },
  'cheek-l':   { id: 'cheek-l',   label: 'Left Cheek',    flippable: true, side: 'L', shapes: CHEEK_L },
  hairline:    { id: 'hairline',  label: 'Hairline',      shapes: HAIRLINE },
  top:         { id: 'top',       label: 'Top View',      shapes: TOP },
  crown:       { id: 'crown',     label: 'Crown',         shapes: CROWN },
  donor:       { id: 'donor',     label: 'Donor Area',    shapes: DONOR },
};
