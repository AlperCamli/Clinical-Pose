// ============ NATURE — Create Post 2: Format ============
import React from 'react';
import { View } from 'react-native';
import Wizard from '../components/Wizard';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import PostPreview from '../components/PostPreview';
import { ActionBar, Card, Btn } from '../components/ui';
import { C } from '../theme';
import { useApp, useNav } from '../store';

const FORMATS = [
  ['1:1', 'Square', 'Feed post'],
  ['4:5', 'Portrait', 'Max feed size'],
  ['9:16', 'Story', 'Full screen'],
];

export default function PostFormatScreen({ route }) {
  const params = route.params || {};
  const { store, t } = useApp();
  const nav = useNav();
  const c = store.clients.find((x) => x.id === params.cid);
  const cs = c.cases.find((x) => x.id === params.caseId);
  const [fmt, setFmt] = React.useState('4:5');
  const cfg = { ...params.cfg, format: fmt };

  return (
    <Wizard step={1} title="Format"
      footer={<ActionBar><Btn variant="primary" lg block label="Next · template" onPress={() => nav.go('postTemplate', { ...params, cfg })} /></ActionBar>}>
      <View style={{ alignItems: 'center', paddingTop: 6, paddingBottom: 18 }}>
        <PostPreview cfg={{ ...cfg, template: 'split', privacy: { logo: true } }} t={t} c={c} cs={cs} size={fmt === '9:16' ? 150 : 210} />
      </View>
      <View style={{ gap: 10 }}>
        {FORMATS.map(([v, name, sub]) => (
          <Card key={v} onPress={() => setFmt(v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderWidth: fmt === v ? 1.5 : 1, borderColor: fmt === v ? C.accent : C.line }}>
            <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: v === '9:16' ? 22 : v === '4:5' ? 30 : 34, height: v === '9:16' ? 38 : v === '4:5' ? 38 : 34, borderWidth: 2, borderColor: fmt === v ? C.accent : C.ink3, borderRadius: 5 }} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontWeight: '600' }}>{name} <Txt mono style={{ fontSize: 12, color: C.ink3 }}>{v}</Txt></Txt>
              <Txt style={{ fontSize: 12, color: C.ink3 }}>{sub}</Txt>
            </View>
            {fmt === v && <Icon name="check" size={18} color={C.accent} />}
          </Card>
        ))}
      </View>
    </Wizard>
  );
}
