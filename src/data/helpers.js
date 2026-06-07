// ============ NATURE — data helpers ============
import { TREATMENTS } from './treatments';

export const TODAY = '2026-06-04';

export function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
export function fmtDateLong(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
export function reqAngles(tid) {
  return TREATMENTS[tid].angles.filter((a) => a.req);
}
export function photoCaptured(photo) {
  return photo?.status === 'captured' && !photo.fileMissing;
}
// Sessions (oldest → newest) that actually captured a given angle — the pool of
// images available to Compare and the social-post builder.
export function capturedSessions(cs, angleId) {
  return cs.sessions.filter((s) => photoCaptured(s.photos[angleId]));
}
// Default before/after for an angle: earliest captured = before, latest = after.
export function beforeAfter(cs, angleId) {
  const ss = capturedSessions(cs, angleId);
  return { before: ss[0], after: ss[ss.length - 1] };
}
export function capCount(session, tid) {
  const reqd = reqAngles(tid);
  const got = reqd.filter((a) => photoCaptured(session.photos[a.id])).length;
  return { got, total: reqd.length };
}
export function uid() {
  return 'x' + Math.random().toString(36).slice(2, 9);
}
export function clone(x) {
  return JSON.parse(JSON.stringify(x));
}
