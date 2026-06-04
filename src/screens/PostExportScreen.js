// ============ NATURE — Create Post 5: Export / Share ============
import React from 'react';
import { View } from 'react-native';
import { Screen, ScrollBody } from '../components/Screen';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import PostPreview from '../components/PostPreview';
import { TopBar, ActionBar, Card, Btn } from '../components/ui';
import { C, PAD } from '../theme';
import { useApp, useNav } from '../store';

export default function PostExportScreen({ route }) {
  const params = route.params || {};
  const { store, t, toast } = useApp();
  const nav = useNav();
  const c = store.clients.find((x) => x.id === params.cid);
  const cs = c.cases.find((x) => x.id === params.caseId);
  const cfg = params.cfg;

  return (
    <Screen>
      <TopBar onBack={nav.back} title="Export" border />
      <ScrollBody contentStyle={{ paddingHorizontal: PAD, paddingTop: 10, paddingBottom: 8, alignItems: 'center' }}>
        <View style={{ paddingTop: 10, paddingBottom: 18 }}>
          <PostPreview cfg={cfg} t={t} c={c} cs={cs} size={cfg.format === '9:16' ? 200 : 248} />
        </View>
        <Card pad style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: C.okWash, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={20} color={C.ok} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt style={{ fontWeight: '600', fontSize: 14 }}>Ready to share</Txt>
            <Txt style={{ fontSize: 12, color: C.ink3 }}>{cfg.format} · {cfg.template} · eyes {cfg.privacy?.eyes}</Txt>
          </View>
        </Card>
      </ScrollBody>
      <ActionBar>
        <View style={{ gap: 10 }}>
          <Btn variant="primary" lg block icon="image" iconSize={19} label="Save to gallery" onPress={() => toast('Saved to gallery')} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Btn icon="share" iconSize={18} label="Share" onPress={() => toast('Opening share…')} style={{ flex: 1 }} />
            <Btn icon="check" iconSize={18} label="Finish" onPress={() => { toast('Done'); nav.popTo('timeline', { cid: c.id, caseId: cs.id }); }} style={{ flex: 1 }} />
          </View>
        </View>
      </ActionBar>
    </Screen>
  );
}
