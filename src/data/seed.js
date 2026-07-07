// ============ NATURE — seed clients, appointments & recent activity ============
// Seed dates are offsets from the install day (real clock) so a fresh install
// always demos "active" cases and upcoming appointments, whenever it happens.
import { TREATMENTS } from './treatments';
import { todayISO, addDaysISO, weekdayOf, atTime } from './clock';

export function makeCaptured(angles, sessionTag) {
  const o = {};
  angles.forEach((a) => {
    o[a.id] = { status: 'captured', tag: sessionTag };
  });
  return o;
}

const d = (n) => addDaysISO(todayISO(), n);

export const SEED_CLIENTS = [
  {
    id: 'c1', name: 'Ayşe K.', code: 'NAT-0142', phone: '+90 532 461 41 02',
    consentClinical: true, consentSocial: true, eyeDefault: 'hidden', initials: 'AK',
    cases: [
      {
        id: 'c1-lip', treatment: 'lip', started: d(-14), practitioner: 'Dr. Demir',
        sessions: [
          { id: 'c1-lip-s1', kind: 'before', label: 'Baseline Before', date: d(-14),
            photos: makeCaptured(TREATMENTS.lip.angles.filter((a) => a.req), 'before') },
          { id: 'c1-lip-s2', kind: 'after', label: 'After 2 weeks', date: d(0),
            photos: makeCaptured(TREATMENTS.lip.angles.filter((a) => a.req), 'after') },
        ],
      },
      {
        id: 'c1-botox', treatment: 'botox', started: d(-53), practitioner: 'Dr. Demir',
        sessions: [
          { id: 'c1-botox-s1', kind: 'before', label: 'Baseline Before', date: d(-53),
            photos: makeCaptured(TREATMENTS.botox.angles.filter((a) => a.req), 'before') },
        ],
      },
    ],
  },
  {
    id: 'c2', name: 'Mert Y.', code: 'NAT-0138', phone: '+90 541 220 88 70',
    consentClinical: true, consentSocial: false, eyeDefault: 'hidden', initials: 'MY',
    cases: [
      {
        id: 'c2-jaw', treatment: 'jaw', started: d(-5), practitioner: 'Dr. Aydın',
        sessions: [
          { id: 'c2-jaw-s1', kind: 'before', label: 'Baseline Before', date: d(-5),
            photos: makeCaptured(TREATMENTS.jaw.angles.filter((a) => a.req), 'before') },
        ],
      },
    ],
  },
  {
    id: 'c3', name: 'Lena F.', code: 'NAT-0151', phone: '+90 505 774 19 33',
    consentClinical: true, consentSocial: true, eyeDefault: 'visible', initials: 'LF',
    cases: [
      {
        id: 'c3-skin', treatment: 'skin', started: d(-3), practitioner: 'Dr. Demir',
        sessions: [
          { id: 'c3-skin-s1', kind: 'before', label: 'Baseline Before', date: d(-3),
            photos: makeCaptured(TREATMENTS.skin.angles.filter((a) => a.req), 'before') },
        ],
      },
    ],
  },
];

// Next Sunday from today (≥ 1 day out) — demos the clinic off-day warning.
const nextSunday = () => addDaysISO(todayISO(), ((7 - weekdayOf(todayISO())) % 7) || 7);

export const SEED_APPOINTMENTS = [
  { id: 'ap1', clientId: 'c2', caseId: 'c2-jaw', practitioner: 'Dr. Aydın', treatment: 'jaw',
    startAt: atTime(d(0), '15:00'), durationMin: 30, status: 'confirmed',
    notes: 'Jaw contour check-up.', reminderLeadMins: [1440, 60], notificationIds: [] },
  { id: 'ap2', clientId: 'c1', caseId: 'c1-lip', practitioner: 'Dr. Demir', treatment: 'lip',
    startAt: atTime(d(1), '10:00'), durationMin: 30, status: 'booked',
    notes: 'Follow-up photos — after 2 weeks.', reminderLeadMins: [1440, 60], notificationIds: [] },
  { id: 'ap3', clientId: 'c3', caseId: 'c3-skin', practitioner: 'Dr. Demir', treatment: 'skin',
    startAt: atTime(d(3), '11:30'), durationMin: 45, status: 'booked',
    notes: '', reminderLeadMins: [1440, 60], notificationIds: [] },
  { id: 'ap4', clientId: 'c1', caseId: 'c1-botox', practitioner: 'Dr. Aydın', treatment: 'botox',
    startAt: atTime(nextSunday(), '13:00'), durationMin: 30, status: 'booked',
    notes: 'Requested Sunday slot (clinic normally closed).', reminderLeadMins: [1440, 60], notificationIds: [] },
];

export const RECENT = [
  { client: 'Ayşe K.', cid: 'c1', treatment: 'lip',  label: 'After 2 weeks',   when: 'Today',      cap: '5/5' },
  { client: 'Lena F.', cid: 'c3', treatment: 'skin', label: 'Baseline Before', when: 'Yesterday',  cap: '3/3' },
  { client: 'Mert Y.', cid: 'c2', treatment: 'jaw',  label: 'Baseline Before', when: '4 days ago', cap: '3/3' },
];
