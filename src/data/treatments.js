// ============ NATURE — treatment protocols (angle = the standardized shot) ============

export const TREATMENTS = {
  lip: {
    id: 'lip', name: 'Lip Filler', short: 'Lip', glyph: 'lips',
    blurb: 'Front + 45° + profile lip series',
    angles: [
      { id: 'fr',  name: 'Front — Relaxed', code: 'FRONT/REL', req: true },
      { id: 'fs',  name: 'Front — Smiling', code: 'FRONT/SMI', req: true },
      { id: 'l45', name: 'Left 45°',        code: 'L-45',      req: true },
      { id: 'r45', name: 'Right 45°',       code: 'R-45',      req: true },
      { id: 'sp',  name: 'Side Profile',    code: 'PROFILE',   req: false },
    ],
  },
  botox: {
    id: 'botox', name: 'Botox', short: 'Botox', glyph: 'forehead', blurb: 'Expression series',
    angles: [
      { id: 'fn',  name: 'Front — Neutral', code: 'FRONT/NEU', req: true },
      { id: 'fb',  name: 'Brows Raised',    code: 'BROWS',     req: true },
      { id: 'ff',  name: 'Frowning',        code: 'FROWN',     req: true },
      { id: 'fs',  name: 'Front — Smiling', code: 'FRONT/SMI', req: true },
      { id: 'l45', name: 'Left 45°',        code: 'L-45',      req: false },
      { id: 'r45', name: 'Right 45°',       code: 'R-45',      req: false },
    ],
  },
  nose: {
    id: 'nose', name: 'Rhinoplasty', short: 'Nose', glyph: 'nose', blurb: 'Full nasal series',
    angles: [
      { id: 'fr',  name: 'Front',         code: 'FRONT',  req: true },
      { id: 'lp',  name: 'Left Profile',  code: 'L-PROF', req: true },
      { id: 'rp',  name: 'Right Profile', code: 'R-PROF', req: true },
      { id: 'l45', name: 'Left 45°',      code: 'L-45',   req: true },
      { id: 'r45', name: 'Right 45°',     code: 'R-45',   req: true },
      { id: 'bv',  name: 'Base View',     code: 'BASE',   req: false },
    ],
  },
  jaw: {
    id: 'jaw', name: 'Jawline / Chin', short: 'Jaw', glyph: 'jaw', blurb: 'Contour series',
    angles: [
      { id: 'fn',  name: 'Front — Neutral', code: 'FRONT/NEU', req: true },
      { id: 'l45', name: 'Left 45°',        code: 'L-45',      req: true },
      { id: 'r45', name: 'Right 45°',       code: 'R-45',      req: true },
      { id: 'lp',  name: 'Left Profile',    code: 'L-PROF',    req: false },
    ],
  },
  eye: {
    id: 'eye', name: 'Under-eye', short: 'Under-eye', glyph: 'eye', blurb: 'Periorbital series',
    angles: [
      { id: 'fn',  name: 'Front — Neutral', code: 'FRONT/NEU', req: true },
      { id: 'l45', name: 'Left 45°',        code: 'L-45',      req: true },
      { id: 'r45', name: 'Right 45°',       code: 'R-45',      req: true },
    ],
  },
  skin: {
    id: 'skin', name: 'Skin', short: 'Skin', glyph: 'skin', blurb: 'Texture & tone series',
    angles: [
      { id: 'fr',  name: 'Front',       code: 'FRONT',   req: true },
      { id: 'l45', name: 'Left 45°',    code: 'L-45',    req: true },
      { id: 'r45', name: 'Right 45°',   code: 'R-45',    req: true },
      { id: 'lc',  name: 'Left Cheek',  code: 'L-CHEEK', req: false },
    ],
  },
  hair: {
    id: 'hair', name: 'Hair Transplant', short: 'Hair', glyph: 'hair', blurb: 'Density mapping series',
    angles: [
      { id: 'hl', name: 'Front Hairline', code: 'HAIRLINE', req: true },
      { id: 'tv', name: 'Top View',       code: 'TOP',      req: true },
      { id: 'cr', name: 'Crown',          code: 'CROWN',    req: true },
      { id: 'dn', name: 'Donor Area',     code: 'DONOR',    req: false },
    ],
  },
  custom: {
    id: 'custom', name: 'Custom Protocol', short: 'Custom', glyph: 'plus', blurb: 'Define your own angles',
    angles: [
      { id: 'fr',  name: 'Front',    code: 'FRONT', req: true },
      { id: 'l45', name: 'Left 45°', code: 'L-45',  req: true },
    ],
  },
};

export const TREATMENT_LIST = ['lip', 'botox', 'nose', 'jaw', 'eye', 'skin', 'hair', 'custom'];

// ---- session type presets ----
export const BEFORE_LABELS = ['Initial Before', 'Pre-treatment', 'First Visit', 'Baseline'];
export const AFTER_LABELS = [
  'After 1 week', 'After 2 weeks', 'After 1 month',
  'Session 2 Before', 'Session 2 After', 'Final Result',
];
