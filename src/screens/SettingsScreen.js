// ============ NATURE — Settings ============
import React from 'react';
import { View, Pressable } from 'react-native';
import { Screen, ScrollBody } from '../components/Screen';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import MonthGrid from '../components/MonthGrid';
import { TopBar, Card, Switch, Segmented, SecLabel, Chip, Sheet, IconBtn, Btn, Tag, Field, Input } from '../components/ui';
import { C, PAD } from '../theme';
import { useApp, useNav } from '../store';
import { REDACTION_OPTIONS } from '../data/redactionStyles';
import { fmtDateLong } from '../data/helpers';
import { NOTIFICATIONS_AVAILABLE, scheduleDailySummary, cancelScheduled, ensureNotifPermission } from '../data/notifications';

const row = { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13, paddingHorizontal: PAD };

const DAY_CHIPS = [['Mon', 1], ['Tue', 2], ['Wed', 3], ['Thu', 4], ['Fri', 5], ['Sat', 6], ['Sun', 0]];
const START_TIMES = ['08:00', '08:30', '09:00', '09:30', '10:00'];
const END_TIMES = ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'];
const SUMMARY_TIMES = ['07:30', '08:00', '08:30', '09:00'];
const REMINDER_OPTIONS = [
  { v: 1440, l: '1 day' },
  { v: 180, l: '3 hours' },
  { v: 60, l: '1 hour' },
];

export default function SettingsScreen() {
  const { t, setTweak, store, toast } = useApp();
  const nav = useNav();
  const [hoursOpen, setHoursOpen] = React.useState(false);
  const [datesOpen, setDatesOpen] = React.useState(false);
  const [msel, setMsel] = React.useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [clinicOpen, setClinicOpen] = React.useState(false);
  const [clinicDraft, setClinicDraft] = React.useState('');
  const [practOpen, setPractOpen] = React.useState(false);
  const [practDraft, setPractDraft] = React.useState('');

  const wh = store.getSetting('workingHours');
  const offWeekdays = store.getSetting('offWeekdays');
  const offDates = store.getSetting('offDates');
  const leads = store.getSetting('reminderDefaults');
  const summary = store.getSetting('dailySummary');
  const eyesDefault = store.getSetting('eyesHiddenDefault');
  const clinicName = store.getSetting('clinicName');
  const practitioners = store.getSetting('practitioners');

  const openClinic = () => {
    setClinicDraft(clinicName);
    setClinicOpen(true);
  };
  const saveClinic = () => {
    const next = clinicDraft.trim() || 'Nature Clinic';
    store.setSetting('clinicName', next);
    setClinicOpen(false);
    toast('Clinic updated');
  };
  const openPractitioners = () => {
    setPractDraft(practitioners.join('\n'));
    setPractOpen(true);
  };
  const savePractitioners = () => {
    const list = [...new Set(practDraft.split(/[\n,]/).map((x) => x.trim()).filter(Boolean))];
    const next = list.length ? list : ['Dr. Demir'];
    store.setSetting('practitioners', next);
    store.setSetting('doctorName', next[0]);
    setPractOpen(false);
    toast('Practitioners updated');
  };

  const toggleWeekday = (d) =>
    store.setSetting('offWeekdays', offWeekdays.includes(d) ? offWeekdays.filter((x) => x !== d) : [...offWeekdays, d]);

  const toggleOffDate = (dateISO) =>
    store.setSetting('offDates', offDates.includes(dateISO) ? offDates.filter((x) => x !== dateISO) : [...offDates, dateISO].sort());

  const toggleLead = (v) =>
    store.setSetting('reminderDefaults', leads.includes(v) ? leads.filter((x) => x !== v) : [...leads, v].sort((a, b) => b - a));

  const setSummary = async (enabled, time = summary.time) => {
    if (!NOTIFICATIONS_AVAILABLE) { toast('Reminders need a dev build'); return; }
    if (summary.notifId) await cancelScheduled(summary.notifId);
    if (!enabled) {
      store.setSetting('dailySummary', { enabled: false, time, notifId: null });
      return;
    }
    if (!(await ensureNotifPermission())) { toast('Notification permission denied'); return; }
    const notifId = await scheduleDailySummary(time);
    store.setSetting('dailySummary', { enabled: !!notifId, time, notifId });
    if (notifId) toast(`Daily summary at ${time}`);
  };

  return (
    <Screen>
      <TopBar onBack={nav.back} title="Settings" border />
      <ScrollBody contentStyle={{ paddingHorizontal: PAD, paddingTop: 14, paddingBottom: 20 }}>
        <SecLabel>Clinic</SecLabel>
        <Card style={{ marginBottom: 16 }}>
          <Pressable onPress={openClinic} style={row}>
            <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}><Icon name="camera" size={20} color="#fff" /></View>
            <View style={{ flex: 1 }}><Txt style={{ fontWeight: '600' }}>{clinicName}</Txt><Txt style={{ fontSize: 12, color: C.ink3 }}>Used in reminders, captions and exports</Txt></View>
            <Icon name="chevR" size={17} color={C.ink3} />
          </Pressable>
          <Pressable onPress={openPractitioners} style={[row, { borderTopWidth: 1, borderTopColor: C.line }]}>
            <View style={{ flex: 1 }}><Txt style={{ fontWeight: '600' }}>Practitioners</Txt><Txt style={{ fontSize: 12, color: C.ink3 }}>{practitioners.join(', ')}</Txt></View>
            <Icon name="chevR" size={17} color={C.ink3} />
          </Pressable>
        </Card>

        <SecLabel>Scheduling</SecLabel>
        <Card style={{ marginBottom: 16 }}>
          <Pressable onPress={() => setHoursOpen(true)} style={row}>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontWeight: '600' }}>Working hours</Txt>
              <Txt style={{ fontSize: 12, color: C.ink3 }}>{wh.start} – {wh.end} · {wh.slotMin}-min slots</Txt>
            </View>
            <Icon name="chevR" size={17} color={C.ink3} />
          </Pressable>
          <View style={{ paddingHorizontal: PAD, paddingVertical: 13, borderTopWidth: 1, borderTopColor: C.line }}>
            <Txt style={{ fontWeight: '600', marginBottom: 3 }}>Weekly closed days</Txt>
            <Txt style={{ fontSize: 12, color: C.ink3, marginBottom: 10 }}>Tinted in the calendar; booking warns but is allowed</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
              {DAY_CHIPS.map(([l, d]) => (
                <Chip key={d} accent on={offWeekdays.includes(d)} label={l} onPress={() => toggleWeekday(d)} />
              ))}
            </View>
          </View>
          <Pressable onPress={() => setDatesOpen(true)} style={[row, { borderTopWidth: 1, borderTopColor: C.line }]}>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontWeight: '600' }}>Closed dates</Txt>
              <Txt style={{ fontSize: 12, color: C.ink3 }}>{offDates.length ? `${offDates.length} date${offDates.length > 1 ? 's' : ''} marked` : 'Holidays are built in for Türkiye'}</Txt>
            </View>
            <Icon name="chevR" size={17} color={C.ink3} />
          </Pressable>
          <View style={{ paddingHorizontal: PAD, paddingVertical: 13, borderTopWidth: 1, borderTopColor: C.line }}>
            <Txt style={{ fontWeight: '600', marginBottom: 10 }}>Default reminders before appointments</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
              {REMINDER_OPTIONS.map(({ v, l }) => (
                <Chip key={v} accent on={leads.includes(v)} label={l} onPress={() => toggleLead(v)} />
              ))}
            </View>
          </View>
          <View style={[row, { borderTopWidth: 1, borderTopColor: C.line }]}>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontWeight: '600' }}>Daily agenda summary</Txt>
              <Txt style={{ fontSize: 12, color: C.ink3 }}>A morning nudge to review the day</Txt>
            </View>
            <Switch on={summary.enabled} onChange={(v) => setSummary(v)} />
          </View>
          {summary.enabled && (
            <View style={{ paddingHorizontal: PAD, paddingBottom: 13, flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
              {SUMMARY_TIMES.map((tm) => (
                <Chip key={tm} accent on={summary.time === tm} label={tm} onPress={() => setSummary(true, tm)} />
              ))}
            </View>
          )}
        </Card>

        <SecLabel>Client messaging</SecLabel>
        <Card style={{ marginBottom: 16 }}>
          <Pressable onPress={() => nav.go('messageTemplates')} style={row}>
            <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: C.accentWash, alignItems: 'center', justifyContent: 'center' }}><Icon name="message" size={19} color={C.accentInk} /></View>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontWeight: '600' }}>Message templates</Txt>
              <Txt style={{ fontSize: 12, color: C.ink3 }}>Reminders, pre/after-care & result texts per treatment</Txt>
            </View>
            <Icon name="chevR" size={17} color={C.ink3} />
          </Pressable>
        </Card>

        <SecLabel>Capture defaults</SecLabel>
        <Card style={{ marginBottom: 16 }}>
          <View style={{ paddingHorizontal: PAD, paddingTop: 13, paddingBottom: 13 }}>
            <View style={{ marginBottom: 11 }}><Txt style={{ fontWeight: '600' }}>Default eye-hide style</Txt><Txt style={{ fontSize: 12, color: C.ink3 }}>Applied to display versions</Txt></View>
            <Segmented options={REDACTION_OPTIONS} value={t.eyeStyle} onChange={(v) => setTweak('eyeStyle', v)} />
          </View>
          <View style={[row, { borderTopWidth: 1, borderTopColor: C.line }]}>
            <View style={{ flex: 1 }}><Txt style={{ fontWeight: '600' }}>Eyes hidden by default</Txt><Txt style={{ fontSize: 12, color: C.ink3 }}>Privacy-safe baseline</Txt></View>
            <Switch on={eyesDefault} onChange={(v) => store.setSetting('eyesHiddenDefault', v)} />
          </View>
        </Card>

        <SecLabel>Sync</SecLabel>
        <Card>
          <Pressable onPress={() => nav.go('sync')} style={row}>
            <View style={{ flex: 1 }}><Txt style={{ fontWeight: '600' }}>Offline & sync</Txt><Txt style={{ fontSize: 12, color: C.ink3 }}>2 sessions pending upload</Txt></View>
            <Icon name="chevR" size={17} color={C.ink3} />
          </Pressable>
        </Card>
        <Txt style={{ textAlign: 'center', marginTop: 24, fontSize: 12.5, color: C.ink3 }}>Nature · MVP preview · v0.9</Txt>
      </ScrollBody>

      <Sheet open={hoursOpen} onClose={() => setHoursOpen(false)} title="Working hours">
        <Txt style={{ fontWeight: '600', marginBottom: 8 }}>Opens</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
          {START_TIMES.map((tm) => (
            <Chip key={tm} accent on={wh.start === tm} label={tm} onPress={() => store.setSetting('workingHours', { ...wh, start: tm })} />
          ))}
        </View>
        <Txt style={{ fontWeight: '600', marginBottom: 8 }}>Closes</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
          {END_TIMES.map((tm) => (
            <Chip key={tm} accent on={wh.end === tm} label={tm} onPress={() => store.setSetting('workingHours', { ...wh, end: tm })} />
          ))}
        </View>
        <Txt style={{ fontWeight: '600', marginBottom: 8 }}>Slot size</Txt>
        <Segmented
          options={[{ v: 15, l: '15 min' }, { v: 30, l: '30 min' }, { v: 60, l: '60 min' }]}
          value={wh.slotMin}
          onChange={(v) => store.setSetting('workingHours', { ...wh, slotMin: v })}
        />
        <Btn variant="primary" block label="Done" style={{ marginTop: 16 }} onPress={() => setHoursOpen(false)} />
      </Sheet>

      <Sheet open={clinicOpen} onClose={() => setClinicOpen(false)} title="Clinic identity">
        <Field label="Clinic name">
          <Input value={clinicDraft} onChangeText={setClinicDraft} placeholder="Nature Clinic" autoFocus />
        </Field>
        <Txt style={{ fontSize: 12.5, color: C.ink3, marginBottom: 14 }}>
          This name is used in client messages, social captions and exported post branding.
        </Txt>
        <Btn variant="primary" block label="Save clinic name" onPress={saveClinic} />
      </Sheet>

      <Sheet open={practOpen} onClose={() => setPractOpen(false)} title="Practitioners">
        <Field label="Names" hint="(one per line or comma-separated)">
          <Input
            value={practDraft}
            onChangeText={setPractDraft}
            placeholder={'Dr. Demir\nDr. Aydın'}
            multiline
            autoFocus
            style={{ minHeight: 110, textAlignVertical: 'top' }}
          />
        </Field>
        <Txt style={{ fontSize: 12.5, color: C.ink3, marginBottom: 14 }}>
          The first practitioner is used as the default doctor in greetings and templates.
        </Txt>
        <Btn variant="primary" block label="Save practitioners" onPress={savePractitioners} />
      </Sheet>

      <Sheet open={datesOpen} onClose={() => setDatesOpen(false)} title="Closed dates">
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <IconBtn name="chevL" bare onPress={() => setMsel((m) => ({ year: m.month === 0 ? m.year - 1 : m.year, month: (m.month + 11) % 12 }))} accessibilityLabel="Previous month" />
          <Txt mono style={{ flex: 1, textAlign: 'center', fontSize: 12, letterSpacing: 1, color: C.ink2, fontWeight: '600' }}>
            {new Date(msel.year, msel.month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }).toUpperCase()}
          </Txt>
          <IconBtn name="chevR" bare onPress={() => setMsel((m) => ({ year: m.month === 11 ? m.year + 1 : m.year, month: (m.month + 1) % 12 }))} accessibilityLabel="Next month" />
        </View>
        <MonthGrid
          year={msel.year} month={msel.month} counts={{}} compact
          offWeekdays={offWeekdays} offDates={offDates}
          onSelectDay={toggleOffDate}
        />
        <Txt style={{ fontSize: 12, color: C.ink3, marginTop: 8, marginBottom: 6 }}>Tap a day to mark the clinic closed. Turkish public holidays are highlighted automatically.</Txt>
        {offDates.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
            {offDates.map((d) => (
              <Tag key={d} variant="warn" style={{ marginBottom: 2 }}>{fmtDateLong(d)}</Tag>
            ))}
          </View>
        )}
        <Btn variant="primary" block label="Done" style={{ marginTop: 8 }} onPress={() => setDatesOpen(false)} />
      </Sheet>
    </Screen>
  );
}
