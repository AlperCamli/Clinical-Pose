// ============ NATURE — Book / edit appointment ============
// Modeled on CaseSetupScreen: client picker Sheet (with quick-add), treatment
// chips, practitioner segmented control — plus the app's own date picker (a
// compact MonthGrid in a Sheet) and working-hours slot chips. Conflicts and
// holiday/off-day cases surface as non-blocking warning cards.
import React from 'react';
import { View, Pressable } from 'react-native';
import { Screen, ScrollBody } from '../components/Screen';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import TGlyph from '../components/TGlyph';
import MonthGrid from '../components/MonthGrid';
import { TopBar, ActionBar, Card, Avatar, Tag, Chip, Segmented, Field, Input, Btn, IconBtn, Sheet } from '../components/ui';
import { C, PAD } from '../theme';
import { useApp, useNav } from '../store';
import { TREATMENTS, TREATMENT_LIST } from '../data/treatments';
import { fmtDateLong, uid } from '../data/helpers';
import { todayISO, atTime, localISODate, fmtTime } from '../data/clock';
import { findConflicts, dayWarnings, slotTimes } from '../data/appointments';
import { scheduleAppointmentReminders, rescheduleAppointmentReminders } from '../data/notifications';

const DURATIONS = [15, 30, 45, 60, 90];
const REMINDER_OPTIONS = [
  { v: 1440, l: '1 day before' },
  { v: 180, l: '3 hours' },
  { v: 60, l: '1 hour' },
];
const CUSTOM_HOURS = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];
const CUSTOM_MINS = ['00', '15', '30', '45'];

export default function AppointmentSetupScreen({ route }) {
  const params = route.params || {};
  const { store, toast, ver } = useApp();
  const nav = useNav();
  const editing = params.aptId ? store.appointments.find((a) => a.id === params.aptId) : null;

  const workingHours = store.getSetting('workingHours');
  const slots = React.useMemo(() => slotTimes(workingHours), [workingHours]);

  const [cid, setCid] = React.useState(params.cid || editing?.clientId || null);
  const [tid, setTid] = React.useState(editing?.treatment || params.tid || null);
  const practitioners = store.getSetting('practitioners');
  const [pract, setPract] = React.useState(editing?.practitioner || practitioners[0]);
  const [dateISO, setDateISO] = React.useState(editing ? localISODate(editing.startAt) : (params.date || todayISO()));
  const [time, setTime] = React.useState(editing ? fmtTime(editing.startAt) : (slots[0] || '10:00'));
  const [durationMin, setDurationMin] = React.useState(editing?.durationMin || 30);
  const [leads, setLeads] = React.useState(editing?.reminderLeadMins ?? store.getSetting('reminderDefaults'));
  const [notes, setNotes] = React.useState(editing?.notes || '');
  const [pickOpen, setPickOpen] = React.useState(false);
  const [dateOpen, setDateOpen] = React.useState(false);
  const [customTime, setCustomTime] = React.useState(!!editing && !slots.includes(fmtTime(editing.startAt)));
  const [q, setQ] = React.useState('');

  const c = store.clients.find((x) => x.id === cid);
  const startAt = atTime(dateISO, time);

  // month shown inside the date-picker sheet — starts at the selected date
  const [msel, setMsel] = React.useState(() => {
    const [y, m] = (editing ? localISODate(editing.startAt) : (params.date || todayISO())).split('-').map(Number);
    return { year: y, month: m - 1 };
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const counts = React.useMemo(() => {
    const map = {};
    for (const a of store.appointments) {
      if (a.status === 'cancelled') continue;
      const key = localISODate(a.startAt);
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [store, ver]);

  const conflicts = findConflicts(store.appointments, { practitioner: pract, startAt, durationMin, excludeId: editing?.id });
  const warn = dayWarnings(dateISO, store.getSetting);
  const slotBusy = (s) =>
    findConflicts(store.appointments, { practitioner: pract, startAt: atTime(dateISO, s), durationMin, excludeId: editing?.id }).length > 0;

  const results = store.clients.filter(
    (x) => !q || x.name.toLowerCase().includes(q.toLowerCase()) || x.code.toLowerCase().includes(q.toLowerCase()) || x.phone.includes(q)
  );

  const save = () => {
    if (!c) { setPickOpen(true); return; }
    if (editing) {
      const oldIds = editing.notificationIds || [];
      store.updateAppointment(editing.id, {
        clientId: c.id, treatment: tid, practitioner: pract, startAt, durationMin, notes, reminderLeadMins: leads,
        notificationIds: [],
      });
      toast('Appointment updated');
      const fresh = store.appointments.find((a) => a.id === editing.id);
      rescheduleAppointmentReminders(fresh, c, oldIds)
        .then((ids) => store.setAppointmentNotifIds(editing.id, ids))
        .catch(() => {});
      nav.back();
      return;
    }
    const appt = {
      id: uid(), clientId: c.id, caseId: params.caseId, treatment: tid, practitioner: pract,
      startAt, durationMin, status: 'booked', notes, reminderLeadMins: leads, notificationIds: [],
    };
    store.addAppointment(appt);
    toast('Appointment booked');
    // permission is requested lazily on the first booking, inside the scheduler
    scheduleAppointmentReminders(appt, c)
      .then((ids) => store.setAppointmentNotifIds(appt.id, ids))
      .catch(() => {});
    nav.replace('appointmentDetail', { aptId: appt.id });
  };

  return (
    <Screen>
      <TopBar onBack={nav.back} title={editing ? 'Edit Appointment' : 'Book Appointment'} border />
      <ScrollBody contentStyle={{ paddingHorizontal: PAD, paddingTop: 16, paddingBottom: 8 }}>
        <Field label="Client">
          {c ? (
            <Card onPress={() => setPickOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 12, paddingHorizontal: 14 }}>
              <Avatar initials={c.initials} size={42} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt style={{ fontWeight: '700' }}>{c.name}</Txt>
                <Txt mono style={{ fontSize: 12, color: C.ink3, marginTop: 2 }}>{c.code}</Txt>
              </View>
              <Chip label="Change" />
            </Card>
          ) : (
            <Pressable onPress={() => setPickOpen(true)} style={selectBox}>
              <Icon name="user" size={18} color={C.ink3} />
              <Txt style={{ flex: 1, color: C.ink3 }}>Select or create a client</Txt>
              <Icon name="chevR" size={17} color={C.ink3} />
            </Pressable>
          )}
        </Field>

        <Field label="Treatment" hint="(optional)">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {TREATMENT_LIST.map((id) => (
              <Chip key={id} accent on={tid === id} label={TREATMENTS[id].short} onPress={() => setTid(tid === id ? null : id)} />
            ))}
          </View>
        </Field>

        <Field label="Practitioner">
          <Segmented options={practitioners} value={pract} onChange={setPract} />
        </Field>

        <Field label="Date">
          <Pressable onPress={() => setDateOpen(true)} style={[selectBox, { gap: 10 }]}>
            <Icon name="calendar" size={18} color={C.ink3} />
            <Txt>{fmtDateLong(dateISO)}</Txt>
            {dateISO === todayISO() && <Tag style={{ marginLeft: 'auto' }}>Today</Tag>}
            <Icon name="chevDown" size={16} color={C.ink3} style={dateISO === todayISO() ? undefined : { marginLeft: 'auto' }} />
          </Pressable>
        </Field>

        {(warn.holiday || warn.offDay) && (
          <Card flat pad style={{ backgroundColor: C.warnWash, borderWidth: 1, borderColor: C.warn + '33', marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="calendar" size={17} color={C.warn} />
            <Txt style={{ flex: 1, fontSize: 12.5, color: C.ink2 }}>
              {warn.holiday
                ? `${warn.holiday.name}${warn.holiday.half ? ' — half day' : ' — public holiday'}`
                : 'The clinic is normally closed on this day'}
              . You can still book.
            </Txt>
            <Tag variant="warn">{warn.holiday ? 'HOLIDAY' : 'OFF DAY'}</Tag>
          </Card>
        )}

        <Field label="Time">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {slots.map((s) => {
              const busy = slotBusy(s);
              return (
                <Chip
                  key={s} accent on={!customTime && time === s} label={s}
                  onPress={() => { setCustomTime(false); setTime(s); }}
                  style={busy && !(time === s && !customTime) ? { backgroundColor: C.warnWash, borderColor: C.warn + '44' } : undefined}
                />
              );
            })}
            <Chip on={customTime} label="Other…" onPress={() => setCustomTime(true)} />
          </View>
          {customTime && (
            <View style={{ marginTop: 10, gap: 8 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {CUSTOM_HOURS.map((h) => (
                  <Chip key={h} accent on={time.slice(0, 2) === h} label={h}
                    onPress={() => setTime(`${h}:${time.slice(3)}`)} />
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {CUSTOM_MINS.map((m) => (
                  <Chip key={m} accent on={time.slice(3) === m} label={`:${m}`}
                    onPress={() => setTime(`${time.slice(0, 2)}:${m}`)} />
                ))}
              </View>
            </View>
          )}
        </Field>

        <Field label="Duration">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {DURATIONS.map((d) => (
              <Chip key={d} accent on={durationMin === d} label={`${d} min`} onPress={() => setDurationMin(d)} />
            ))}
          </View>
        </Field>

        {conflicts.length > 0 && (
          <Card flat pad style={{ backgroundColor: C.warnWash, borderWidth: 1, borderColor: C.warn + '33', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Tag variant="warn">OVERLAPS</Tag>
              <Txt style={{ fontSize: 12.5, color: C.ink2, fontWeight: '600' }}>{pract} already has:</Txt>
            </View>
            {conflicts.map((x) => {
              const cc = store.clients.find((y) => y.id === x.clientId);
              return (
                <Txt key={x.id} mono style={{ fontSize: 12.5, color: C.ink2, marginTop: 2 }}>
                  {fmtTime(x.startAt)}–{fmtTime(x.startAt + (x.durationMin || 30) * 60000)}  {cc?.name || 'Client'}
                </Txt>
              );
            })}
            <Txt style={{ fontSize: 12, color: C.ink3, marginTop: 6 }}>Double-booking is allowed but flagged.</Txt>
          </Card>
        )}

        <Field label="Reminders" hint="(for you — before the appointment)">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {REMINDER_OPTIONS.map(({ v, l }) => (
              <Chip key={v} accent on={leads.includes(v)} label={l}
                onPress={() => setLeads(leads.includes(v) ? leads.filter((x) => x !== v) : [...leads, v].sort((a, b) => b - a))} />
            ))}
          </View>
        </Field>

        <Field label="Notes" hint="(optional)">
          <Input value={notes} onChangeText={setNotes} placeholder="Notes for this appointment…" multiline style={{ minHeight: 64, textAlignVertical: 'top' }} />
        </Field>
      </ScrollBody>
      <ActionBar>
        <Btn variant="primary" lg block disabled={!c} icon="calendar" iconSize={19} onPress={save}
          label={c ? (editing ? 'Save changes' : 'Book appointment') : 'Select a client to continue'} />
      </ActionBar>

      <Sheet open={dateOpen} onClose={() => setDateOpen(false)} title="Pick a date">
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <IconBtn name="chevL" bare onPress={() => setMsel((m) => ({ year: m.month === 0 ? m.year - 1 : m.year, month: (m.month + 11) % 12 }))} accessibilityLabel="Previous month" />
          <Txt mono style={{ flex: 1, textAlign: 'center', fontSize: 12, letterSpacing: 1, color: C.ink2, fontWeight: '600' }}>
            {new Date(msel.year, msel.month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }).toUpperCase()}
          </Txt>
          <IconBtn name="chevR" bare onPress={() => setMsel((m) => ({ year: m.month === 11 ? m.year + 1 : m.year, month: (m.month + 1) % 12 }))} accessibilityLabel="Next month" />
        </View>
        <MonthGrid
          year={msel.year} month={msel.month} counts={counts} selected={dateISO} compact
          offWeekdays={store.getSetting('offWeekdays')} offDates={store.getSetting('offDates')}
          onSelectDay={(d) => { setDateISO(d); setDateOpen(false); }}
        />
      </Sheet>

      <Sheet open={pickOpen} onClose={() => setPickOpen(false)} title="Select client">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: C.line2, backgroundColor: C.surface, borderRadius: 13, paddingRight: 12, marginBottom: 12 }}>
          <View style={{ paddingLeft: 14 }}><Icon name="search" size={19} color={C.ink3} /></View>
          <Input autoFocus value={q} onChangeText={setQ} placeholder="Name, client code or phone" style={{ flex: 1, borderWidth: 0, backgroundColor: 'transparent', borderRadius: 0, paddingHorizontal: 0 }} />
          {q ? <IconBtn name="x" size={18} color={C.ink3} bare onPress={() => setQ('')} /> : null}
        </View>
        <Card onPress={() => { setPickOpen(false); nav.go('newClient', { after: 'appointment', date: dateISO }); }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 12, borderWidth: 1.5, borderColor: C.accent, backgroundColor: C.accentWash }}>
          <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={20} color="#fff" /></View>
          <View><Txt style={{ fontWeight: '700', color: C.accentInk }}>New Client</Txt><Txt style={{ fontSize: 12.5, color: C.ink3 }}>Create a profile + consent</Txt></View>
        </Card>
        <Card>
          {results.map((x, i) => (
            <Pressable key={x.id} onPress={() => { setCid(x.id); setPickOpen(false); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13, paddingHorizontal: PAD, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
              <Avatar initials={x.initials} size={40} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt style={{ fontWeight: '600' }}>{x.name}</Txt>
                <Txt mono style={{ fontSize: 12, color: C.ink3, marginTop: 2 }}>{x.code} · {x.cases.length} case{x.cases.length === 1 ? '' : 's'}</Txt>
              </View>
              {cid === x.id && <Icon name="check" size={18} color={C.accent} />}
            </Pressable>
          ))}
          {results.length === 0 && <View style={{ padding: 22, alignItems: 'center' }}><Txt style={{ fontSize: 13.5, color: C.ink3 }}>No client matches “{q}”.</Txt></View>}
        </Card>
      </Sheet>
    </Screen>
  );
}

const selectBox = { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: C.line2, backgroundColor: C.surface, borderRadius: 13, paddingVertical: 13, paddingHorizontal: 14 };
