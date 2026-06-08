// ============ NATURE — Create Post 3: Template (per-photo) ============
import React from 'react';
import { View, ScrollView } from 'react-native';
import Wizard from '../components/Wizard';
import Txt from '../components/Txt';
import PostPreview from '../components/PostPreview';
import { ActionBar, Card, Btn } from '../components/ui';
import { C } from '../theme';
import { useApp, useNav } from '../store';
import { reqAngles } from '../data/helpers';

const TEMPLATES = [
  ['split', 'Before / After split'],
  ['slider', 'Slider reveal'],
  ['timeline', 'Timeline progress'],
  ['single', 'Close-up result'],
];
const SLIDE_W = 200;

export default function PostTemplateScreen({ route }) {
  const params = route.params || {};
  const { store, t } = useApp();
  const nav = useNav();
  const c = store.clients.find((x) => x.id === params.cid);
  const cs = c.cases.find((x) => x.id === params.caseId);

  const angleIds = params.cfg?.sel?.length ? params.cfg.sel : [undefined];
  // per-photo template map, keyed by angle id
  const [templates, setTemplates] = React.useState(() =>
    Object.fromEntries(angleIds.map((a) => [a, 'split']))
  );
  const [page, setPage] = React.useState(0);
  const cfg = { ...params.cfg, templates };

  const curAngle = angleIds[Math.min(page, angleIds.length - 1)];
  const curTmpl = templates[curAngle] ?? 'split';
  const setCur = (v) => setTemplates((o) => ({ ...o, [curAngle]: v }));

  const angleName = React.useMemo(() => {
    const m = {};
    reqAngles(cs.treatment).forEach((a) => { m[a.id] = a.name; });
    return m;
  }, [cs.treatment]);

  return (
    <Wizard step={1} total={3} title="Template" sub="Clean, clinical layouts"
      footer={<ActionBar><Btn variant="primary" lg block label="Next · privacy" onPress={() => nav.go('postPrivacy', { ...params, cfg })} /></ActionBar>}>
      <View style={{ alignItems: 'center', paddingTop: 4, paddingBottom: 14 }}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / SLIDE_W))}
          style={{ flexGrow: 0, width: SLIDE_W }}
        >
          {angleIds.map((aid, i) => (
            <View key={aid || i} style={{ width: SLIDE_W }}>
              <PostPreview cfg={{ ...cfg, sel: aid ? [aid] : undefined, template: templates[aid] ?? 'split', privacy: { logo: true } }} t={t} c={c} cs={cs} size={SLIDE_W} />
            </View>
          ))}
        </ScrollView>
        {angleIds.length > 1 && (
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
            {angleIds.map((aid, i) => (
              <View key={aid || i} style={{ width: 6, height: 6, borderRadius: 99, backgroundColor: i === page ? C.accent : C.surface3 }} />
            ))}
          </View>
        )}
      </View>
      {angleIds.length > 1 && (
        <Txt style={{ fontSize: 12.5, color: C.ink3, textAlign: 'center', marginBottom: 12 }}>
          Layout for slide {Math.min(page, angleIds.length - 1) + 1} of {angleIds.length}
          {curAngle && angleName[curAngle] ? ` · ${angleName[curAngle]}` : ''}
        </Txt>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 11 }}>
        {TEMPLATES.map(([v, name]) => (
          <Card key={v} onPress={() => setCur(v)} style={{ width: '47.8%', flexGrow: 1, padding: 10, alignItems: 'center', gap: 9, borderWidth: curTmpl === v ? 1.5 : 1, borderColor: curTmpl === v ? C.accent : C.line }}>
            <PostPreview cfg={{ format: '1:1', template: v, sel: curAngle ? [curAngle] : undefined, privacy: { logo: true } }} t={t} c={c} cs={cs} size={120} />
            <Txt style={{ fontWeight: '600', fontSize: 12.5, textAlign: 'center' }}>{name}</Txt>
          </Card>
        ))}
      </View>
    </Wizard>
  );
}
