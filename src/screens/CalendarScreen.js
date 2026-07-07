// ============ NATURE — Calendar (vertically-scrolling months) ============
// Continuous month view: scroll down for future months (−12…+24 around the
// current one). Fixed-height month blocks let the FlatList jump straight to
// "today" via getItemLayout. On tablets (≥768dp) the selected day's agenda
// docks as a second pane instead of navigating away.
import React from 'react';
import { View, FlatList, useWindowDimensions } from 'react-native';
import { Screen, ScrollBody } from '../components/Screen';
import Txt from '../components/Txt';
import MonthGrid, { monthGridHeight } from '../components/MonthGrid';
import DayAgenda from '../components/DayAgenda';
import { TopBar, Chip, IconBtn } from '../components/ui';
import { C, PAD } from '../theme';
import { useApp, useNav } from '../store';
import { localISODate, todayISO, fmtMonthTitle } from '../data/clock';

const MONTHS_BEFORE = 12;
const MONTHS_AFTER = 24;
const MONTH_HEADER_H = 34;
const MONTH_MARGIN = 18;
const ITEM_H = MONTH_HEADER_H + monthGridHeight(false) + MONTH_MARGIN;

export default function CalendarScreen() {
  const { store, ver } = useApp();
  const nav = useNav();
  const { width } = useWindowDimensions();
  const twoPane = width >= 768;
  const listRef = React.useRef(null);
  const [selected, setSelected] = React.useState(todayISO());

  const anchor = React.useMemo(() => {
    const t = new Date();
    return { year: t.getFullYear(), month: t.getMonth() };
  }, []);

  const months = React.useMemo(() => {
    const out = [];
    for (let i = -MONTHS_BEFORE; i <= MONTHS_AFTER; i++) {
      const d = new Date(anchor.year, anchor.month + i, 1);
      out.push({ key: `${d.getFullYear()}-${d.getMonth()}`, year: d.getFullYear(), month: d.getMonth() });
    }
    return out;
  }, [anchor]);

  // one flat dateISO→count map; each MonthGrid cell looks itself up
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

  const offWeekdays = store.getSetting('offWeekdays');
  const offDates = store.getSetting('offDates');

  const onSelectDay = (dateISO) => {
    if (twoPane) setSelected(dateISO);
    else nav.go('day', { date: dateISO });
  };

  const scrollToToday = () => {
    listRef.current?.scrollToIndex({ index: MONTHS_BEFORE, animated: true });
    setSelected(todayISO());
  };

  const renderMonth = ({ item }) => (
    <View style={{ height: ITEM_H, paddingHorizontal: PAD }}>
      <View style={{ height: MONTH_HEADER_H, justifyContent: 'center' }}>
        <Txt mono style={{ fontSize: 11.5, letterSpacing: 1.2, color: C.ink2, fontWeight: '600' }}>
          {fmtMonthTitle(item.year, item.month)}
        </Txt>
      </View>
      <MonthGrid
        year={item.year}
        month={item.month}
        counts={counts}
        selected={twoPane ? selected : undefined}
        onSelectDay={onSelectDay}
        offWeekdays={offWeekdays}
        offDates={offDates}
      />
    </View>
  );

  const list = (
    <FlatList
      ref={listRef}
      data={months}
      keyExtractor={(m) => m.key}
      renderItem={renderMonth}
      extraData={`${ver}:${selected}`}
      getItemLayout={(_, index) => ({ length: ITEM_H, offset: ITEM_H * index, index })}
      initialScrollIndex={MONTHS_BEFORE}
      initialNumToRender={4}
      windowSize={7}
      showsVerticalScrollIndicator={false}
      onScrollToIndexFailed={() => {}}
      contentContainerStyle={{ paddingTop: 10, paddingBottom: 30 }}
    />
  );

  return (
    <Screen>
      <TopBar
        onBack={nav.back}
        title="Calendar"
        border
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Chip label="Today" onPress={scrollToToday} />
            <IconBtn name="plus" onPress={() => nav.go('appointmentSetup', { date: selected })} accessibilityLabel="Book appointment" />
          </View>
        }
      />
      {twoPane ? (
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={{ flex: 1.15, borderRightWidth: 1, borderRightColor: C.line }}>{list}</View>
          <View style={{ flex: 1 }}>
            <ScrollBody contentStyle={{ paddingHorizontal: PAD, paddingTop: 14, paddingBottom: 20 }}>
              <DayAgenda date={selected} onChangeDate={setSelected} embedded />
            </ScrollBody>
          </View>
        </View>
      ) : (
        list
      )}
    </Screen>
  );
}
