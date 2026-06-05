// ============ NATURE — Before/After Compare ============
import React from 'react';
import { View, PanResponder } from 'react-native';
import { Screen, ScrollBody } from '../components/Screen';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import Photo from '../components/Photo';
import { TopBar, ActionBar, Card, Chip, Segmented, Btn, IconBtn, SecLabel } from '../components/ui';
import { C, PAD } from '../theme';
import { useApp, useNav } from '../store';
import { TREATMENTS } from '../data/treatments';
import { reqAngles, fmtDate } from '../data/helpers';

function AngleLabel({ text, ok, right }) {
  return (
    <View style={{ position: 'absolute', top: 8, left: right ? undefined : 8, right: right ? 8 : undefined, zIndex: 3, paddingVertical: 3, paddingHorizontal: 7, borderRadius: 6, backgroundColor: ok ? C.ok : 'rgba(28,37,48,0.72)' }}>
      <Txt mono style={{ fontSize: 9.5, fontWeight: '600', letterSpacing: 0.4, color: '#fff' }}>{text}</Txt>
    </View>
  );
}

export default function CompareScreen({ route }) {
  const params = route.params || {};
  const { store, t } = useApp();
  const nav = useNav();
  const c = store.clients.find((x) => x.id === params.cid);
  const cs = c.cases.find((x) => x.id === params.caseId);
  const angles = reqAngles(cs.treatment);
  const [mode, setMode] = React.useState('slider');
  const [angleId, setAngleId] = React.useState(angles[0].id);
  const [eye, setEye] = React.useState(true);
  const [reveal, setReveal] = React.useState(50);
  const [w, setW] = React.useState(0);
  const wRef = React.useRef(0);

  const pan = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => move(e.nativeEvent.locationX),
      onPanResponderMove: (e) => move(e.nativeEvent.locationX),
    })
  ).current;
  function move(x) {
    if (!wRef.current) return;
    setReveal(Math.max(0, Math.min(100, (x / wRef.current) * 100)));
  }
  const revealX = (reveal / 100) * w;

  return (
    <Screen>
      <TopBar onBack={nav.back} title="Compare" sub={`${TREATMENTS[cs.treatment].name} · ${c.name}`} border
        right={<IconBtn name={eye ? 'eyeoff' : 'eye'} size={18} color={eye ? C.accentInk : C.ink2} onPress={() => setEye((v) => !v)} accessibilityLabel="Eyes" />} />
      <View style={{ paddingHorizontal: PAD, paddingTop: 12, paddingBottom: 6 }}>
        <Segmented options={[{ v: 'side', l: 'Side by side' }, { v: 'slider', l: 'Slider' }, { v: 'timeline', l: 'Timeline' }]} value={mode} onChange={setMode} />
      </View>

      <ScrollBody contentStyle={{ paddingHorizontal: PAD, paddingTop: 8, paddingBottom: 8 }}>
        {mode === 'side' && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Card style={{ flex: 1, overflow: 'hidden', height: 300 }}>
              <Photo eyeHidden={eye} eyeStyle={t.eyeStyle} variant="plain" style={{ height: '100%', borderRadius: 0, borderWidth: 0 }} />
              <AngleLabel text="BEFORE" />
            </Card>
            <Card style={{ flex: 1, overflow: 'hidden', height: 300 }}>
              <Photo eyeHidden={eye} eyeStyle={t.eyeStyle} variant="plain" style={{ height: '100%', borderRadius: 0, borderWidth: 0 }} />
              <AngleLabel text="AFTER" ok />
            </Card>
          </View>
        )}

        {mode === 'slider' && (
          <Card
            {...pan.panHandlers}
            onLayout={(e) => { wRef.current = e.nativeEvent.layout.width; setW(e.nativeEvent.layout.width); }}
            style={{ overflow: 'hidden', height: 330 }}
          >
            <Photo eyeHidden={eye} eyeStyle={t.eyeStyle} variant="plain" style={{ height: '100%', borderRadius: 0, borderWidth: 0 }} />
            {/* after, revealed from handle to right */}
            <View style={{ position: 'absolute', top: 0, bottom: 0, left: revealX, width: Math.max(0, w - revealX), overflow: 'hidden' }}>
              <Photo eyeHidden={eye} eyeStyle={t.eyeStyle} variant="plain" style={{ position: 'absolute', left: -revealX, top: 0, width: w, height: '100%', borderRadius: 0, borderWidth: 0 }} />
              <View style={{ position: 'absolute', top: 0, left: -revealX, width: w, height: '100%', backgroundColor: 'rgba(255,255,255,0.05)' }} />
            </View>
            <AngleLabel text="BEFORE" />
            <AngleLabel text="AFTER" ok right />
            {/* divider + handle */}
            <View style={{ position: 'absolute', top: 0, bottom: 0, left: revealX - 1, width: 2, backgroundColor: '#fff' }} />
            <View style={{ position: 'absolute', top: '50%', left: revealX - 19, marginTop: -19, width: 38, height: 38, borderRadius: 99, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 4 }}>
              <Icon name="slider" size={18} color={C.accentInk} />
            </View>
          </Card>
        )}

        {mode === 'timeline' && (
          <ScrollBody horizontal contentStyle={{ gap: 8, paddingBottom: 6 }} style={{ flexGrow: 0 }}>
            {cs.sessions.map((s) => (
              <View key={s.id} style={{ width: 130 }}>
                <Photo eyeHidden={eye} eyeStyle={t.eyeStyle} uri={s.photos[angleId]?.uri}
                  eyeBoxes={s.photos[angleId]?.eyeBoxes} imgW={s.photos[angleId]?.imgW} imgH={s.photos[angleId]?.imgH}
                  variant="plain" style={{ height: 170 }} />
                <View style={{ alignItems: 'center', marginTop: 6 }}>
                  <Txt style={{ fontWeight: '600', fontSize: 12.5 }}>{s.label}</Txt>
                  <Txt mono style={{ fontSize: 10.5, color: C.ink3 }}>{fmtDate(s.date)}</Txt>
                </View>
              </View>
            ))}
          </ScrollBody>
        )}

        <SecLabel style={{ marginTop: 16 }}>Angle</SecLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {angles.map((a) => <Chip key={a.id} accent on={angleId === a.id} label={a.name} onPress={() => setAngleId(a.id)} />)}
        </View>
      </ScrollBody>
      <ActionBar>
        <Btn variant="primary" lg block icon="image" iconSize={19} label="Create social post" onPress={() => nav.go('postSelect', { cid: c.id, caseId: cs.id })} />
      </ActionBar>
    </Screen>
  );
}
