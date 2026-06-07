// ============ NATURE — Create Post 1: Select photos ============
import React from 'react';
import { View } from 'react-native';
import Wizard from '../components/Wizard';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import Photo from '../components/Photo';
import { ActionBar, Card, Btn, Segmented, SecLabel } from '../components/ui';
import { C } from '../theme';
import { useApp, useNav } from '../store';
import { reqAngles, beforeAfter, fmtDate } from '../data/helpers';

export default function PostSelectScreen({ route }) {
  const params = route.params || {};
  const { store, t } = useApp();
  const nav = useNav();
  const c = store.clients.find((x) => x.id === params.cid);
  const cs = c.cases.find((x) => x.id === params.caseId);
  const angles = reqAngles(cs.treatment);
  const [sel, setSel] = React.useState([angles[0].id]);
  const [mode, setMode] = React.useState('single');
  const toggle = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const ph = (s, aid) => {
    const p = s?.photos?.[aid];
    return { uri: p?.uri, eyeBoxes: p?.eyeBoxes, imgW: p?.imgW, imgH: p?.imgH, fileMissing: p?.fileMissing };
  };

  return (
    <Wizard step={0} title="Select photos" sub="Best before / after pairs"
      footer={<ActionBar><Btn variant="primary" lg block disabled={!sel.length} label="Next · format" onPress={() => nav.go('postFormat', { ...params, cfg: { sel, mode } })} /></ActionBar>}>
      <View style={{ flexDirection: 'row', gap: 7, marginHorizontal: 3, marginBottom: 12 }}>
        <Icon name="sparkle" size={15} color={C.accent} style={{ marginTop: 1 }} />
        <Txt style={{ flex: 1, fontSize: 12.5, color: C.ink3 }}>Suggested pairs are matched by angle automatically.</Txt>
      </View>
      <View style={{ gap: 11, marginBottom: 16 }}>
        {angles.map((a) => {
          const on = sel.includes(a.id);
          const { before, after } = beforeAfter(cs, a.id);
          const range = before && after ? `${fmtDate(before.date)} → ${fmtDate(after.date)}` : 'BEFORE → AFTER';
          return (
            <Card key={a.id} onPress={() => toggle(a.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderWidth: on ? 1.5 : 1, borderColor: on ? C.accent : C.line }}>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <Photo eyeStyle={t.eyeStyle} {...ph(before, a.id)} variant="plain" style={{ width: 48, height: 60 }} />
                <Photo eyeStyle={t.eyeStyle} {...ph(after, a.id)} variant="plain" style={{ width: 48, height: 60 }} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt style={{ fontWeight: '600', fontSize: 14.5 }}>{a.name}</Txt>
                <Txt mono style={{ fontSize: 11, color: C.ink3 }}>{range}</Txt>
              </View>
              <View style={{ width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: on ? C.accent : C.line2, backgroundColor: on ? C.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {on && <Icon name="check" size={15} color="#fff" />}
              </View>
            </Card>
          );
        })}
      </View>
      <SecLabel>Layout</SecLabel>
      <Segmented options={[{ v: 'single', l: 'Single' }, { v: 'carousel', l: 'Carousel' }, { v: 'timeline', l: 'Timeline' }]} value={mode} onChange={setMode} />
    </Wizard>
  );
}
