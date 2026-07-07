// ============ NATURE — one day's agenda (shared) ============
// Week strip + holiday/off-day banner + the day's appointment cards. Used by
// DayAgendaScreen on phones and rendered inline as the right pane of the
// two-pane tablet calendar.
import React from 'react';
import { View, Pressable } from 'react-native';
import Txt from './Txt';
import Icon from './Icon';
import { Card, Avatar, Tag, IconBtn, Btn } from './ui';
import { C } from '../theme';
import { useApp, useNav } from '../store';
import { TREATMENTS } from '../data/treatments';
import { apptsOn, dayWarnings, STATUS_TAG } from '../data/appointments';
import { addDaysISO, weekdayOf, fmtTime, fmtDayTitle, todayISO } from '../data/clock';
import { holidayOf } from '../data/holidays-tr';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function WeekStrip({ date, onChangeDate, hasAppts }) {
  // Monday of the containing week
  const monday = addDaysISO(date, -((weekdayOf(date) + 6) % 7));
  const days = Array.from({ length: 7 }, (_, i) => addDaysISO(monday, i));
  const today = todayISO();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 14 }}>
      <IconBtn name="chevL" size={17} bare onPress={() => onChangeDate(addDaysISO(date, -7))} accessibilityLabel="Previous week" />
      {days.map((d, i) => {
        const sel = d === date;
        const off = !!holidayOf(d);
        return (
          <Pressable key={d} onPress={() => onChangeDate(d)} style={{ flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 12, backgroundColor: sel ? C.accent : 'transparent' }}>
            <Txt mono style={{ fontSize: 9.5, color: sel ? 'rgba(255,255,255,0.8)' : C.ink3 }}>{DAY_LETTERS[i]}</Txt>
            <Txt mono style={{ fontSize: 14, fontWeight: '600', marginTop: 1, color: sel ? '#fff' : off ? C.warn : d === today ? C.accent : C.ink }}>
              {Number(d.slice(8))}
            </Txt>
            <View style={{ width: 4, height: 4, borderRadius: 99, marginTop: 2, backgroundColor: hasAppts(d) ? (sel ? '#fff' : C.accent) : 'transparent' }} />
          </Pressable>
        );
      })}
      <IconBtn name="chevR" size={17} bare onPress={() => onChangeDate(addDaysISO(date, 7))} accessibilityLabel="Next week" />
    </View>
  );
}

export function AppointmentRow({ appt, client, onPress, style, showDate }) {
  const cancelled = appt.status === 'cancelled';
  const st = STATUS_TAG[appt.status] || STATUS_TAG.booked;
  const endMs = appt.startAt + (appt.durationMin || 30) * 60000;
  const sub = showDate
    ? new Date(appt.startAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : fmtTime(endMs);
  return (
    <Card onPress={onPress} style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, opacity: cancelled ? 0.55 : 1 }, style]}>
      <View style={{ alignItems: 'center', minWidth: 46 }}>
        <Txt mono style={{ fontSize: 15, fontWeight: '600', textDecorationLine: cancelled ? 'line-through' : 'none' }}>{fmtTime(appt.startAt)}</Txt>
        <Txt mono style={{ fontSize: 10.5, color: C.ink3, marginTop: 1 }}>{sub}</Txt>
      </View>
      <Avatar initials={client?.initials || '?'} size={40} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt style={{ fontWeight: '700' }} numberOfLines={1}>{client?.name || 'Unknown client'}</Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
          {appt.treatment ? <Tag variant="accent">{TREATMENTS[appt.treatment]?.short || appt.treatment}</Tag> : null}
          <Txt style={{ fontSize: 11.5, color: C.ink3 }} numberOfLines={1}>{appt.practitioner}</Txt>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Tag variant={st.variant} dot>{st.label}</Tag>
        {appt.reminderSentAt ? <Icon name="bell" size={13} color={C.ok} /> : null}
      </View>
    </Card>
  );
}

export default function DayAgenda({ date, onChangeDate, embedded }) {
  const { store } = useApp();
  const nav = useNav();
  const appts = apptsOn(store.appointments, date, true);
  const warn = dayWarnings(date, store.getSetting);
  const hasAppts = (d) => apptsOn(store.appointments, d).length > 0;

  return (
    <View>
      <WeekStrip date={date} onChangeDate={onChangeDate} hasAppts={hasAppts} />

      {(warn.holiday || warn.offDay) && (
        <Card flat pad style={{ backgroundColor: C.warnWash, borderWidth: 1, borderColor: C.warn + '33', marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Icon name="calendar" size={17} color={C.warn} />
          <Txt style={{ flex: 1, fontSize: 13, color: C.ink2 }}>
            {warn.holiday ? `${warn.holiday.name}${warn.holiday.half ? ' (half day)' : ''}` : 'Clinic closed'}
            {warn.holiday && warn.offDay ? ' · clinic closed' : ''}
          </Txt>
          <Tag variant="warn">{warn.holiday ? 'HOLIDAY' : 'OFF DAY'}</Tag>
        </Card>
      )}

      {appts.length === 0 ? (
        <Card pad style={{ alignItems: 'center', paddingVertical: 30 }}>
          <Icon name="calendar" size={26} color={C.ink3} />
          <Txt style={{ fontWeight: '700', marginTop: 10 }}>No appointments</Txt>
          <Txt style={{ fontSize: 12.5, color: C.ink3, marginTop: 3 }}>{fmtDayTitle(date)} is free.</Txt>
        </Card>
      ) : (
        appts.map((a) => (
          <AppointmentRow
            key={a.id}
            appt={a}
            client={store.clients.find((x) => x.id === a.clientId)}
            onPress={() => nav.go('appointmentDetail', { aptId: a.id })}
            style={{ marginBottom: 10 }}
          />
        ))
      )}

      {embedded && (
        <Btn variant="soft" block icon="plus" label="Book appointment" style={{ marginTop: 6 }}
          onPress={() => nav.go('appointmentSetup', { date })} />
      )}
    </View>
  );
}
