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
export function capCount(session, tid) {
  const reqd = reqAngles(tid);
  const got = reqd.filter((a) => session.photos[a.id]?.status === 'captured').length;
  return { got, total: reqd.length };
}
export function uid() {
  return 'x' + Math.random().toString(36).slice(2, 9);
}
export function clone(x) {
  return JSON.parse(JSON.stringify(x));
}
