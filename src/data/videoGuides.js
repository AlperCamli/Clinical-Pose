// ============ NATURE — guided video sequences ============
// A clinical documentation video is a standardized "turn": hold each of the
// treatment's angles for a few seconds with a short transition between them.
// The steps drive the on-screen prompts + live guide overlay during recording;
// the overlay is NOT recorded into the file — the clip stays clean.
import { TREATMENTS } from './treatments';
import { resolveOverlay } from './overlays';

const HOLD_SEC = 3;
const TURN_SEC = 2;

// → [{ label, sub, overlay|null, sec }]
export function guidedSequence(tid) {
  const T = TREATMENTS[tid] || TREATMENTS.custom;
  const angles = T.angles.filter((a) => a.req);
  const steps = [];
  angles.forEach((a, i) => {
    if (i > 0) {
      steps.push({
        label: 'Slowly turn…', sub: `next: ${a.name}`, overlay: null, sec: TURN_SEC,
      });
    }
    steps.push({
      label: `${a.name} — hold`, sub: a.code, overlay: resolveOverlay(a), sec: HOLD_SEC,
    });
  });
  return steps;
}

export const sequenceDuration = (steps) => steps.reduce((s, x) => s + x.sec, 0);
