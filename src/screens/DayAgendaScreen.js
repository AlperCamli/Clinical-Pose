// ============ NATURE — Day agenda ============
import React from 'react';
import { Screen, ScrollBody } from '../components/Screen';
import DayAgenda from '../components/DayAgenda';
import { TopBar, ActionBar, Btn } from '../components/ui';
import { PAD } from '../theme';
import { useNav } from '../store';
import { fmtDayTitle, todayISO } from '../data/clock';

export default function DayAgendaScreen({ route }) {
  const nav = useNav();
  const [date, setDate] = React.useState(route.params?.date || todayISO());

  return (
    <Screen>
      <TopBar onBack={nav.back} title={fmtDayTitle(date)} sub={date === todayISO() ? 'Today' : undefined} border />
      <ScrollBody contentStyle={{ paddingHorizontal: PAD, paddingTop: 14, paddingBottom: 8 }}>
        <DayAgenda date={date} onChangeDate={setDate} />
      </ScrollBody>
      <ActionBar>
        <Btn variant="primary" lg block icon="plus" label="Book appointment"
          onPress={() => nav.go('appointmentSetup', { date })} />
      </ActionBar>
    </Screen>
  );
}
