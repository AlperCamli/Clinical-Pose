// ============ NATURE — per-angle default eye box (no ML) ============
// Because the doctor poses into a known capture overlay, the eye location is
// known a priori per angle. defaultEyeBox() seeds the adjustable redaction box
// from the angle's `code`; the doctor then confirms/corrects it by hand.
// Returns a normalized box { x, y, w, h, rot } or null (no eyes in this frame).
// Values are deliberately generous starting points — tune on device; the manual
// drag/pinch/rotate is the privacy guarantee.

const frontBar = () => ({ x: 0.26, y: 0.36, w: 0.48, h: 0.12, rot: 0 });

// 45°: both eyes still in frame, shifted toward the near side and slightly tilted.
const oblique = (side) => ({
  x: side === 'R' ? 0.18 : 0.30,
  y: 0.36, w: 0.44, h: 0.12,
  rot: side === 'R' ? -4 : 4,
});

// Profile / cheek: a single near eye toward the forward-facing side of the frame.
const profileEye = (side) => ({
  x: side === 'R' ? 0.30 : 0.46,
  y: 0.36, w: 0.20, h: 0.12, rot: 0,
});

export function defaultEyeBox(angle) {
  const code = (angle?.code || '').toUpperCase();
  if (!code) return frontBar();
  // angles that don't frame the eyes at all
  if (/CROWN|TOP|BASE|DONOR/.test(code)) return null;
  const side = code.startsWith('R') ? 'R' : 'L'; // best-effort; doctor adjusts
  if (/PROF|PROFILE|CHEEK/.test(code)) return profileEye(side);
  if (code.includes('45')) return oblique(side);
  // FRONT*, BROWS, FROWN, HAIRLINE, and anything else face-on
  return frontBar();
}
