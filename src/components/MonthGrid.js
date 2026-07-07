// ============ NATURE — month grid (calendar primitive) ============
// Pure presentational month: Monday-first, ALWAYS 6 rows so every month block
// has the same height (CalendarScreen's FlatList relies on getItemLayout).
// Reused by the vertical calendar, the booking date-picker Sheet and the
// Settings closed-dates picker.
import React from 'react';
import { View, Pressable } from 'react-native';
import Txt from './Txt';
import { C } from '../theme';
import { todayISO, localISODate, weekdayOf } from '../data/clock';
import { holidayOf } from '../data/holidays-tr';

export const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

// 6×7 matrix of ISO dates (null = out-of-month filler).
export function buildMonthMatrix(year, month /* 0-based */) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday-first offset
  const rows = [];
  let day = 1 - lead;
  for (let r = 0; r < 6; r++) {
    const row = [];
    for (let c = 0; c < 7; c++, day++) {
      row.push(day >= 1 && day <= daysInMonth ? localISODate(new Date(year, month, day).getTime()) : null);
    }
    rows.push(row);
  }
  return rows;
}

export const CELL_H = 46;
export const CELL_H_COMPACT = 40;
export const HEADER_H = 24; // weekday label row
export const monthGridHeight = (compact) => HEADER_H + 6 * (compact ? CELL_H_COMPACT : CELL_H);

function DayCell({ dateISO, count, selected, isToday, offDay, holiday, compact, onPress }) {
  const h = compact ? CELL_H_COMPACT : CELL_H;
  if (!dateISO) return <View style={{ flex: 1, height: h }} />;
  const dayNum = Number(dateISO.slice(8));
  const wash = holiday ? C.warnWash : offDay ? C.surface3 : 'transparent';
  return (
    <Pressable onPress={() => onPress?.(dateISO)} style={{ flex: 1, height: h, alignItems: 'center', paddingTop: 3 }}>
      <View style={{
        width: compact ? 28 : 32, height: compact ? 28 : 32, borderRadius: 99,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: selected ? C.accent : wash,
        borderWidth: isToday && !selected ? 1.5 : 0, borderColor: C.accent,
      }}>
        <Txt mono style={{
          fontSize: compact ? 12 : 13,
          fontWeight: selected || isToday ? '600' : '400',
          color: selected ? '#fff' : holiday ? C.warn : offDay ? C.ink3 : C.ink,
        }}>
          {dayNum}
        </Txt>
      </View>
      <View style={{ flexDirection: 'row', gap: 2.5, marginTop: 2, height: 4 }}>
        {Array.from({ length: Math.min(count || 0, 3) }).map((_, i) => (
          <View key={i} style={{ width: 4, height: 4, borderRadius: 99, backgroundColor: selected ? C.accent : C.accent }} />
        ))}
      </View>
    </Pressable>
  );
}

// counts: { 'YYYY-MM-DD': n } (may span any range — cells look themselves up)
export default function MonthGrid({ year, month, counts, selected, onSelectDay, offWeekdays = [], offDates = [], compact }) {
  const matrix = React.useMemo(() => buildMonthMatrix(year, month), [year, month]);
  const today = todayISO();
  return (
    <View>
      <View style={{ flexDirection: 'row', height: HEADER_H, alignItems: 'center' }}>
        {WEEKDAYS.map((w) => (
          <Txt key={w} mono style={{ flex: 1, textAlign: 'center', fontSize: 9.5, color: C.ink3, letterSpacing: 0.5 }}>{w}</Txt>
        ))}
      </View>
      {matrix.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {row.map((dateISO, i) => (
            <DayCell
              key={i}
              dateISO={dateISO}
              count={dateISO ? counts?.[dateISO] : 0}
              selected={!!dateISO && dateISO === selected}
              isToday={dateISO === today}
              offDay={!!dateISO && (offWeekdays.includes(weekdayOf(dateISO)) || offDates.includes(dateISO))}
              holiday={!!dateISO && !!holidayOf(dateISO)}
              compact={compact}
              onPress={onSelectDay}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
