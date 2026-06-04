// ============ NATURE — seed clients & recent activity ============
import { TREATMENTS } from './treatments';

export function makeCaptured(angles, sessionTag) {
  const o = {};
  angles.forEach((a) => {
    o[a.id] = { status: 'captured', tag: sessionTag };
  });
  return o;
}

export const SEED_CLIENTS = [
  {
    id: 'c1', name: 'Ayşe K.', code: 'NAT-0142', phone: '+90 5•• ••• 41 02',
    consentClinical: true, consentSocial: true, eyeDefault: 'hidden', initials: 'AK',
    cases: [
      {
        id: 'case1', treatment: 'lip', started: '2026-05-21', practitioner: 'Dr. Demir',
        sessions: [
          { id: 's1', kind: 'before', label: 'Baseline Before', date: '2026-05-21',
            photos: makeCaptured(TREATMENTS.lip.angles.filter((a) => a.req), 'before') },
          { id: 's2', kind: 'after', label: 'After 2 weeks', date: '2026-06-04',
            photos: makeCaptured(TREATMENTS.lip.angles.filter((a) => a.req), 'after') },
        ],
      },
      {
        id: 'case2', treatment: 'botox', started: '2026-04-12', practitioner: 'Dr. Demir',
        sessions: [
          { id: 's1', kind: 'before', label: 'Baseline Before', date: '2026-04-12',
            photos: makeCaptured(TREATMENTS.botox.angles.filter((a) => a.req), 'before') },
        ],
      },
    ],
  },
  {
    id: 'c2', name: 'Mert Y.', code: 'NAT-0138', phone: '+90 5•• ••• 88 70',
    consentClinical: true, consentSocial: false, eyeDefault: 'hidden', initials: 'MY',
    cases: [
      {
        id: 'case1', treatment: 'jaw', started: '2026-05-30', practitioner: 'Dr. Aydın',
        sessions: [
          { id: 's1', kind: 'before', label: 'Baseline Before', date: '2026-05-30',
            photos: makeCaptured(TREATMENTS.jaw.angles.filter((a) => a.req), 'before') },
        ],
      },
    ],
  },
  {
    id: 'c3', name: 'Lena F.', code: 'NAT-0151', phone: '+90 5•• ••• 19 33',
    consentClinical: true, consentSocial: true, eyeDefault: 'visible', initials: 'LF',
    cases: [
      {
        id: 'case1', treatment: 'skin', started: '2026-06-01', practitioner: 'Dr. Demir',
        sessions: [
          { id: 's1', kind: 'before', label: 'Baseline Before', date: '2026-06-01',
            photos: makeCaptured(TREATMENTS.skin.angles.filter((a) => a.req), 'before') },
        ],
      },
    ],
  },
];

export const RECENT = [
  { client: 'Ayşe K.', cid: 'c1', treatment: 'lip',  label: 'After 2 weeks',   when: 'Today',      cap: '5/5' },
  { client: 'Lena F.', cid: 'c3', treatment: 'skin', label: 'Baseline Before', when: 'Yesterday',  cap: '3/3' },
  { client: 'Mert Y.', cid: 'c2', treatment: 'jaw',  label: 'Baseline Before', when: '4 days ago', cap: '3/3' },
];
