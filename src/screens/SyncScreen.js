// ============ NATURE — Sync Status ============
import React from 'react';
import { View } from 'react-native';
import { Screen, ScrollBody } from '../components/Screen';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import { TopBar, ActionBar, Card, Tag, Btn, SecLabel } from '../components/ui';
import { C, PAD } from '../theme';
import { useApp, useNav } from '../store';

export default function SyncScreen() {
  const { toast } = useApp();
  const nav = useNav();
  const [items, setItems] = React.useState([
    { id: 1, who: 'Ayşe K.', what: 'After 2 weeks · 5 photos', state: 'pending' },
    { id: 2, who: 'Lena F.', what: 'Baseline Before · 3 photos', state: 'pending' },
    { id: 3, who: 'Mert Y.', what: 'Baseline Before · 3 photos', state: 'done' },
  ]);
  const pending = items.filter((i) => i.state === 'pending').length;
  const syncNow = () => { setItems((it) => it.map((x) => ({ ...x, state: 'done' }))); toast('All sessions synced'); };

  return (
    <Screen>
      <TopBar onBack={nav.back} title="Sync" sub={pending ? `${pending} pending` : 'All up to date'} border />
      <ScrollBody contentStyle={{ paddingHorizontal: PAD, paddingTop: 16, paddingBottom: 8 }}>
        <Card pad style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: pending ? C.warnWash : C.okWash, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="cloud" size={26} color={pending ? C.warn : C.ok} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt style={{ fontWeight: '700' }}>{pending ? `${pending} session${pending > 1 ? 's' : ''} waiting` : 'Everything synced'}</Txt>
            <Txt style={{ fontSize: 12.5, color: C.ink3 }}>Photos are saved locally first — nothing is lost offline.</Txt>
          </View>
        </Card>
        <SecLabel>Upload queue</SecLabel>
        <Card>
          {items.map((it, i) => (
            <View key={it.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13, paddingHorizontal: PAD, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
              <View style={{ flex: 1 }}><Txt style={{ fontWeight: '600', fontSize: 14.5 }}>{it.who}</Txt><Txt style={{ fontSize: 12, color: C.ink3 }}>{it.what}</Txt></View>
              {it.state === 'done' ? <Tag variant="ok" icon="check">Synced</Tag> : <Tag variant="warn" dot>Pending</Tag>}
            </View>
          ))}
        </Card>
      </ScrollBody>
      <ActionBar>
        <Btn variant="primary" lg block disabled={!pending} icon="cloud" iconSize={18} label="Sync now" onPress={syncNow} />
      </ActionBar>
    </Screen>
  );
}
