// ============ NATURE — Appointment detail ============
// The operational hub for one booking: status lifecycle (A7), send-reminder
// sheet, shot-list preview (D1) and the "Start capture" handoff (A6) that
// turns the appointment into a real case/session and jumps into the existing
// angle-checklist → camera flow.
import React from 'react';
import { View, Pressable } from 'react-native';
import { Screen, ScrollBody } from '../components/Screen';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import TGlyph from '../components/TGlyph';
import GuideOverlay from '../components/GuideOverlay';
import SendReminderSheet from '../components/SendReminderSheet';
import { TopBar, ActionBar, Card, Avatar, Tag, Chip, Btn, IconBtn, Sheet, SecLabel } from '../components/ui';
import { C, PAD } from '../theme';
import { useApp, useNav } from '../store';
import { TREATMENTS, AFTER_LABELS } from '../data/treatments';
import { fmtDateLong, uid } from '../data/helpers';
import { todayISO, localISODate, fmtTime } from '../data/clock';
import { NEXT_STATUS, STATUS_TAG, dayWarnings } from '../data/appointments';
import { resolveOverlay } from '../data/overlays';

function InfoRow({ icon, label, value, mono }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: PAD, borderTopWidth: 1, borderTopColor: C.line }}>
      <Icon name={icon} size={17} color={C.ink3} />
      <Txt style={{ fontSize: 12.5, color: C.ink3, width: 86 }}>{label}</Txt>
      <Txt mono={mono} style={{ flex: 1, fontWeight: '600', fontSize: 14 }}>{value}</Txt>
    </View>
  );
}

export default function AppointmentDetailScreen({ route }) {
  const params = route.params || {};
  const { store, toast } = useApp();
  const nav = useNav();
  const appt = store.appointments.find((a) => a.id === params.aptId);
  const c = appt ? store.clients.find((x) => x.id === appt.clientId) : null;
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [shotsOpen, setShotsOpen] = React.useState(false);
  const [sendOpen, setSendOpen] = React.useState(!!params.openSend);
  React.useEffect(() => {
    if (params.openSend || params.openSendAt) setSendOpen(true);
  }, [params.openSend, params.openSendAt]);
  if (!appt || !c) return null;

  const T = appt.treatment ? TREATMENTS[appt.treatment] : null;
  const st = STATUS_TAG[appt.status] || STATUS_TAG.booked;
  const next = NEXT_STATUS[appt.status];
  const dateISO = localISODate(appt.startAt);
  const warn = dayWarnings(dateISO, store.getSetting);
  const endMs = appt.startAt + (appt.durationMin || 30) * 60000;
  const openCase = appt.caseId ? c.cases.find((x) => x.id === appt.caseId) : null;
  const done = appt.status === 'completed' || appt.status === 'cancelled' || appt.status === 'no-show';

  // A6 — appointment → capture handoff. An appointment already tied to a case
  // gets a follow-up session on it; otherwise a fresh case + baseline session
  // is created (same shape CaseSetupScreen builds).
  const startCapture = () => {
    let caseId = openCase?.id;
    let sessionId;
    if (caseId) {
      const session = { id: uid(), kind: 'after', label: AFTER_LABELS[0], date: todayISO(), photos: {}, refSource: 'baseline' };
      store.addSession(c.id, caseId, session);
      sessionId = session.id;
    } else {
      const session = { id: uid(), kind: 'before', label: 'Baseline Before', date: todayISO(), photos: {} };
      const cs = { id: uid(), treatment: appt.treatment || 'custom', started: todayISO(), practitioner: appt.practitioner, sessions: [session] };
      store.addCase(c.id, cs);
      caseId = cs.id;
      sessionId = session.id;
    }
    store.linkAppointmentSession(appt.id, { caseId, sessionId });
    store.setAppointmentStatus(appt.id, 'in-progress');
    nav.go('angleChecklist', { cid: c.id, caseId, sessionId, aptId: appt.id });
  };

  const shotAngles = T ? T.angles : [];

  return (
    <Screen>
      <TopBar
        onBack={nav.back} title="Appointment" sub={fmtDateLong(dateISO)} border
        right={!done ? <IconBtn name="settings" onPress={() => nav.go('appointmentSetup', { aptId: appt.id })} accessibilityLabel="Edit appointment" /> : null}
      />
      <ScrollBody contentStyle={{ paddingHorizontal: PAD, paddingTop: 16, paddingBottom: 8 }}>
        <Card onPress={() => nav.go('clientProfile', { cid: c.id })} pad style={{ flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 16 }}>
          <Avatar initials={c.initials} size={48} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt style={{ fontWeight: '700', fontSize: 16 }}>{c.name}</Txt>
            <Txt mono style={{ fontSize: 12, color: C.ink3, marginTop: 2 }}>{c.code}{c.phone ? ` · ${c.phone}` : ''}</Txt>
          </View>
          <Icon name="chevR" size={17} color={C.ink3} />
        </Card>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Tag variant={st.variant} dot style={{ paddingVertical: 5, paddingHorizontal: 10 }}>{st.label}</Tag>
          {appt.reminderSentAt ? <Tag variant="ok" icon="bell">Reminder sent {fmtTime(appt.reminderSentAt)}</Tag> : null}
          {warn.holiday ? <Tag variant="warn">HOLIDAY</Tag> : warn.offDay ? <Tag variant="warn">OFF DAY</Tag> : null}
        </View>

        <Card style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: PAD }}>
            {T ? (
              <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: C.accentWash, alignItems: 'center', justifyContent: 'center' }}>
                <TGlyph tid={appt.treatment} size={23} />
              </View>
            ) : (
              <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="calendar" size={19} color={C.ink3} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Txt style={{ fontWeight: '700', fontSize: 15 }}>{T ? T.name : 'General appointment'}</Txt>
              {openCase ? <Txt style={{ fontSize: 12, color: C.ink3, marginTop: 1 }}>Linked case · started {fmtDateLong(openCase.started)}</Txt> : null}
            </View>
            {openCase ? <Chip label="Timeline" onPress={() => nav.go('timeline', { cid: c.id, caseId: openCase.id })} /> : null}
          </View>
          <InfoRow icon="clock" label="Time" mono value={`${fmtTime(appt.startAt)} – ${fmtTime(endMs)} · ${appt.durationMin} min`} />
          <InfoRow icon="user" label="Practitioner" value={appt.practitioner} />
          {appt.reminderLeadMins?.length ? (
            <InfoRow icon="bell" label="Reminders" value={appt.reminderLeadMins.map((m) => (m >= 1440 ? `${m / 1440}d` : m >= 60 ? `${m / 60}h` : `${m}m`)).join(' · ') + ' before'} />
          ) : null}
          {appt.notes ? <InfoRow icon="note" label="Notes" value={appt.notes} /> : null}
        </Card>

        {!done && (
          <>
            <SecLabel style={{ marginBottom: 8 }}>Status</SecLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
              {next && (
                <Chip accent on icon="check" label={`Mark ${STATUS_TAG[next].label.toLowerCase()}`}
                  onPress={() => { store.setAppointmentStatus(appt.id, next); toast(`Marked ${STATUS_TAG[next].label.toLowerCase()}`); }} />
              )}
              <Chip label="No-show" onPress={() => { store.setAppointmentStatus(appt.id, 'no-show'); toast('Marked no-show'); }} />
              <Chip label="Cancel…" onPress={() => setCancelOpen(true)} />
            </View>
          </>
        )}

        <SecLabel style={{ marginBottom: 8 }}>Prepare</SecLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
          <Chip icon="send" label={appt.reminderSentAt ? 'Send again' : 'Send client reminder'} onPress={() => setSendOpen(true)} />
          {T ? <Chip icon="camera" label={`Shot list (${shotAngles.length})`} onPress={() => setShotsOpen(true)} /> : null}
        </View>
      </ScrollBody>

      {!done && (
        <ActionBar>
          <Btn variant="primary" lg block icon="camera" iconSize={19}
            label={openCase ? 'Start capture — follow-up session' : 'Start capture — new case'}
            onPress={startCapture} />
        </ActionBar>
      )}

      <Sheet open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel appointment">
        <Txt style={{ fontSize: 13.5, color: C.ink2, marginBottom: 14 }}>
          {c.name} — {fmtDateLong(dateISO)} at {fmtTime(appt.startAt)}. Scheduled reminders will be removed.
        </Txt>
        <Btn variant="primary" block label="Cancel appointment" style={{ backgroundColor: C.danger, borderColor: C.danger, shadowColor: C.danger }}
          onPress={() => { store.cancelAppointment(appt.id); setCancelOpen(false); toast('Appointment cancelled'); }} />
        <Btn variant="ghost" block label="Delete permanently" style={{ marginTop: 8 }}
          onPress={() => { store.deleteAppointment(appt.id); setCancelOpen(false); toast('Appointment deleted'); nav.back(); }} />
      </Sheet>

      <Sheet open={shotsOpen} onClose={() => setShotsOpen(false)} title={T ? `${T.name} — shot list` : 'Shot list'}>
        {shotAngles.map((a, i) => (
          <View key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
            <View style={{ width: 52, height: 70, borderRadius: 10, backgroundColor: '#0c0f14', overflow: 'hidden' }}>
              <GuideOverlay overlay={resolveOverlay(a)} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontWeight: '600' }}>{a.name}</Txt>
              <Txt mono style={{ fontSize: 11, color: C.ink3, marginTop: 2 }}>{a.code}</Txt>
            </View>
            <Tag variant={a.req ? 'accent' : 'miss'}>{a.req ? 'REQUIRED' : 'OPTIONAL'}</Tag>
          </View>
        ))}
      </Sheet>

      <SendReminderSheet open={sendOpen} onClose={() => setSendOpen(false)} appt={appt} client={c} />
    </Screen>
  );
}
