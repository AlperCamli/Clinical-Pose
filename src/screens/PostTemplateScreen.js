// ============ NATURE — Create Post 3: Template ============
import React from 'react';
import { View } from 'react-native';
import Wizard from '../components/Wizard';
import Txt from '../components/Txt';
import PostPreview from '../components/PostPreview';
import { ActionBar, Card, Btn } from '../components/ui';
import { C } from '../theme';
import { useApp, useNav } from '../store';

const TEMPLATES = [
  ['split', 'Before / After split'],
  ['slider', 'Slider reveal'],
  ['timeline', 'Timeline progress'],
  ['single', 'Close-up result'],
];

export default function PostTemplateScreen({ route }) {
  const params = route.params || {};
  const { store, t } = useApp();
  const nav = useNav();
  const c = store.clients.find((x) => x.id === params.cid);
  const cs = c.cases.find((x) => x.id === params.caseId);
  const [tmpl, setTmpl] = React.useState('split');
  const cfg = { ...params.cfg, template: tmpl };

  return (
    <Wizard step={2} title="Template" sub="Clean, clinical layouts"
      footer={<ActionBar><Btn variant="primary" lg block label="Next · privacy" onPress={() => nav.go('postPrivacy', { ...params, cfg })} /></ActionBar>}>
      <View style={{ alignItems: 'center', paddingTop: 4, paddingBottom: 18 }}>
        <PostPreview cfg={{ ...cfg, privacy: { logo: true } }} t={t} c={c} cs={cs} size={200} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 11 }}>
        {TEMPLATES.map(([v, name]) => (
          <Card key={v} onPress={() => setTmpl(v)} style={{ width: '47.8%', flexGrow: 1, padding: 10, alignItems: 'center', gap: 9, borderWidth: tmpl === v ? 1.5 : 1, borderColor: tmpl === v ? C.accent : C.line }}>
            <PostPreview cfg={{ format: '1:1', template: v, privacy: { logo: true } }} t={t} c={c} cs={cs} size={120} />
            <Txt style={{ fontWeight: '600', fontSize: 12.5, textAlign: 'center' }}>{name}</Txt>
          </Card>
        ))}
      </View>
    </Wizard>
  );
}
