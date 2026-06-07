// ============ NATURE — Before/After Compare ============
import React from 'react';
import { View, Pressable, PanResponder } from 'react-native';
import { Screen, ScrollBody } from '../components/Screen';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import Photo from '../components/Photo';
import { TopBar, ActionBar, Card, Chip, Tag, Segmented, Btn, IconBtn, SecLabel } from '../components/ui';
import { C, PAD } from '../theme';
import { useApp, useNav } from '../store';
import { TREATMENTS } from '../data/treatments';
import { reqAngles, fmtDate, capturedSessions } from '../data/helpers';

function AngleLabel({ text, ok, right }) {
  return (
    <View style={{ position: 'absolute', top: 8, left: right ? undefined : 8, right: right ? 8 : undefined, zIndex: 3, paddingVertical: 3, paddingHorizontal: 7, borderRadius: 6, backgroundColor: ok ? C.ok : 'rgba(28,37,48,0.72)' }}>
      <Txt mono style={{ fontSize: 9.5, fontWeight: '600', letterSpacing: 0.4, color: '#fff' }}>{text}</Txt>
    </View>
  );
}

// centered hint shown in the preview area when there's nothing (yet) to compare
function PreviewHint({ text, height = 300 }) {
  return (
    <Card style={{ height, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 24 }}>
      <Icon name="image" size={26} color={C.ink3} />
      <Txt style={{ fontSize: 13.5, color: C.ink3, textAlign: 'center' }}>{text}</Txt>
    </Card>
  );
}

export default function CompareScreen({ route }) {
  const params = route.params || {};
  const { store, t } = useApp();
  const nav = useNav();
  const c = store.clients.find((x) => x.id === params.cid);
  const cs = c?.cases.find((x) => x.id === params.caseId);
  const angles = cs ? reqAngles(cs.treatment) : [];

  const [mode, setMode] = React.useState('slider');
  const [angleId, setAngleId] = React.useState(angles[0]?.id);
  const [eye, setEye] = React.useState(true);
  const [reveal, setReveal] = React.useState(50);
  const [w, setW] = React.useState(0);
  const wRef = React.useRef(0);
  const boxRef = React.useRef(null);
  const leftRef = React.useRef(0); // slider's screen-left X (for absolute drag mapping)

  // sessions that actually captured this angle = the pool of images to compare
  const photoOf = (s) => s.photos[angleId];
  const avail = React.useMemo(
    () => (cs ? capturedSessions(cs, angleId) : []),
    [cs, angleId]
  );
  // spread a session's stored photo props into <Photo …> (uri + eye geometry)
  const ph = (s) => {
    const p = s && photoOf(s);
    return { uri: p?.uri, eyeBoxes: p?.eyeBoxes, imgW: p?.imgW, imgH: p?.imgH, fileMissing: p?.fileMissing };
  };

  // selection: ordered pair (side + slider, max 2) and a free set (timeline)
  const [pairSel, setPairSel] = React.useState([]);
  const [tlSel, setTlSel] = React.useState([]);
  // sensible defaults whenever the angle (hence the available pool) changes
  React.useEffect(() => {
    const ids = avail.map((s) => s.id);
    setPairSel(ids.length >= 2 ? [ids[0], ids[ids.length - 1]] : ids.slice(0, 2));
    setTlSel(ids);
  }, [avail]);

  // map an ABSOLUTE screen X to the reveal %, relative to the slider's left edge.
  // Using gestureState's screen coords (not nativeEvent.locationX, which is relative
  // to whichever child is under the finger) keeps the drag smooth and jump-free.
  const measureBox = () => boxRef.current?.measureInWindow((x) => { leftRef.current = x; });
  function moveAbs(absX) {
    if (!wRef.current) return;
    const rel = absX - leftRef.current;
    setReveal(Math.max(0, Math.min(100, (rel / wRef.current) * 100)));
  }
  const pan = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e, g) => { measureBox(); moveAbs(g.x0); },
      onPanResponderMove: (e, g) => moveAbs(g.moveX),
      // don't let the surrounding ScrollView yank the gesture away mid-drag
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
    })
  ).current;

  if (!c || !cs) return null;

  function togglePair(id) {
    setPairSel((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length < 2) return [...cur, id];
      return [cur[1], id]; // FIFO: drop the oldest pick, keep the two most recent taps
    });
  }
  function toggleTl(id) {
    setTlSel((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  // resolve the chosen pair, chronological so earlier = BEFORE, later = AFTER
  const pair = pairSel
    .map((id) => avail.find((s) => s.id === id))
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));
  const A = pair[0];
  const B = pair[1];
  const revealX = (reveal / 100) * w;
  const tlShown = avail.filter((s) => tlSel.includes(s.id)).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Screen>
      <TopBar onBack={nav.back} title="Compare" sub={`${TREATMENTS[cs.treatment].name} · ${c.name}`} border
        right={<IconBtn name={eye ? 'eyeoff' : 'eye'} size={18} color={eye ? C.accentInk : C.ink2} onPress={() => setEye((v) => !v)} accessibilityLabel="Eyes" />} />
      <View style={{ paddingHorizontal: PAD, paddingTop: 12, paddingBottom: 6 }}>
        <Segmented options={[{ v: 'side', l: 'Side by side' }, { v: 'slider', l: 'Slider' }, { v: 'timeline', l: 'Timeline' }]} value={mode} onChange={setMode} />
      </View>

      <ScrollBody contentStyle={{ paddingHorizontal: PAD, paddingTop: 8, paddingBottom: 8 }}>
        {avail.length === 0 && <PreviewHint text="No captured photos for this angle yet." />}

        {avail.length > 0 && mode === 'side' && (
          pair.length < 2
            ? <PreviewHint text="Select 2 images below to compare." />
            : (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[{ s: A, text: 'BEFORE', ok: false }, { s: B, text: 'AFTER', ok: true }].map(({ s, text, ok }) => (
                  <View key={text} style={{ flex: 1 }}>
                    <Card style={{ overflow: 'hidden', height: 300 }}>
                      <Photo eyeHidden={eye} eyeStyle={t.eyeStyle} {...ph(s)} variant="plain" style={{ height: '100%', borderRadius: 0, borderWidth: 0 }} />
                      <AngleLabel text={text} ok={ok} />
                    </Card>
                    <View style={{ alignItems: 'center', marginTop: 6 }}>
                      <Txt style={{ fontWeight: '600', fontSize: 12.5 }} numberOfLines={1}>{s.label}</Txt>
                      <Txt mono style={{ fontSize: 10.5, color: C.ink3 }}>{fmtDate(s.date)}</Txt>
                    </View>
                  </View>
                ))}
              </View>
            )
        )}

        {avail.length > 0 && mode === 'slider' && (
          pair.length < 2
            ? <PreviewHint text="Select 2 images below to compare." height={330} />
            : (
              <>
                <View
                  ref={boxRef}
                  {...pan.panHandlers}
                  onLayout={(e) => { wRef.current = e.nativeEvent.layout.width; setW(e.nativeEvent.layout.width); measureBox(); }}
                >
                  <Card style={{ overflow: 'hidden', height: 330 }}>
                    <Photo eyeHidden={eye} eyeStyle={t.eyeStyle} {...ph(A)} variant="plain" style={{ height: '100%', borderRadius: 0, borderWidth: 0 }} />
                    {/* after, revealed from handle to right */}
                    <View style={{ position: 'absolute', top: 0, bottom: 0, left: revealX, width: Math.max(0, w - revealX), overflow: 'hidden' }}>
                      <Photo eyeHidden={eye} eyeStyle={t.eyeStyle} {...ph(B)} variant="plain" style={{ position: 'absolute', left: -revealX, top: 0, width: w, height: '100%', borderRadius: 0, borderWidth: 0 }} />
                      <View style={{ position: 'absolute', top: 0, left: -revealX, width: w, height: '100%', backgroundColor: 'rgba(255,255,255,0.05)' }} />
                    </View>
                    <AngleLabel text="BEFORE" />
                    <AngleLabel text="AFTER" ok right />
                    {/* divider + handle */}
                    <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: revealX - 1, width: 2, backgroundColor: '#fff' }} />
                    <View pointerEvents="none" style={{ position: 'absolute', top: '50%', left: revealX - 19, marginTop: -19, width: 38, height: 38, borderRadius: 99, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 4 }}>
                      <Icon name="slider" size={18} color={C.accentInk} />
                    </View>
                  </Card>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingHorizontal: 2 }}>
                  <Txt mono style={{ fontSize: 10.5, color: C.ink3 }} numberOfLines={1}>{A.label} · {fmtDate(A.date)}</Txt>
                  <Txt mono style={{ fontSize: 10.5, color: C.ok }} numberOfLines={1}>{B.label} · {fmtDate(B.date)}</Txt>
                </View>
              </>
            )
        )}

        {avail.length > 0 && mode === 'timeline' && (
          tlShown.length === 0
            ? <PreviewHint text="Select sessions below to build the timeline." />
            : (
              <ScrollBody horizontal contentStyle={{ gap: 8, paddingBottom: 6 }} style={{ flexGrow: 0 }}>
                {tlShown.map((s) => (
                  <View key={s.id} style={{ width: 130 }}>
                    <Photo eyeHidden={eye} eyeStyle={t.eyeStyle} {...ph(s)} variant="plain" style={{ height: 170 }} />
                    <View style={{ alignItems: 'center', marginTop: 6 }}>
                      <Txt style={{ fontWeight: '600', fontSize: 12.5 }} numberOfLines={1}>{s.label}</Txt>
                      <Txt mono style={{ fontSize: 10.5, color: C.ink3 }}>{fmtDate(s.date)}</Txt>
                    </View>
                  </View>
                ))}
              </ScrollBody>
            )
        )}

        <SecLabel style={{ marginTop: 16 }}>Angle</SecLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {angles.map((a) => <Chip key={a.id} accent on={angleId === a.id} label={a.name} onPress={() => setAngleId(a.id)} />)}
        </View>

        <SecLabel style={{ marginTop: 18 }}>
          {mode === 'timeline' ? 'Select sessions to show' : `Select 2 to compare (${pairSel.length}/2)`}
        </SecLabel>
        {avail.length === 0 ? (
          <Txt style={{ fontSize: 12.5, color: C.ink3, marginHorizontal: 3 }}>No captured photos for this angle yet.</Txt>
        ) : (
          <ScrollBody horizontal contentStyle={{ gap: 8, paddingBottom: 4, paddingRight: 4 }} style={{ flexGrow: 0 }}>
            {avail.map((s) => {
              const selected = mode === 'timeline' ? tlSel.includes(s.id) : pairSel.includes(s.id);
              const pairIdx = pair.findIndex((x) => x.id === s.id); // 0 = before, 1 = after
              return (
                <Pressable key={s.id} onPress={() => (mode === 'timeline' ? toggleTl(s.id) : togglePair(s.id))} style={{ width: 84 }}>
                  <View style={{ borderRadius: 12, borderWidth: selected ? 2 : 1, borderColor: selected ? C.accent : C.line2, backgroundColor: C.surface, padding: 2 }}>
                    <Photo eyeHidden={eye} eyeStyle={t.eyeStyle} {...ph(s)} variant="plain" style={{ height: 100, borderRadius: 9 }}>
                      {selected && mode === 'timeline' && (
                        <View style={{ position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: 99, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}>
                          <Icon name="check" size={13} color="#fff" />
                        </View>
                      )}
                      {selected && mode !== 'timeline' && pairIdx !== -1 && (
                        <View style={{ position: 'absolute', top: 5, left: 5 }}>
                          <Tag variant={pairIdx === 1 ? 'ok' : 'accent'}>{pairIdx === 1 ? 'AFTER' : 'BEFORE'}</Tag>
                        </View>
                      )}
                    </Photo>
                  </View>
                  <Txt style={{ fontWeight: '600', fontSize: 11.5, marginTop: 5, textAlign: 'center' }} numberOfLines={1}>{s.label}</Txt>
                  <Txt mono style={{ fontSize: 10, color: C.ink3, textAlign: 'center' }}>{fmtDate(s.date)}</Txt>
                </Pressable>
              );
            })}
          </ScrollBody>
        )}
      </ScrollBody>
      <ActionBar>
        <Btn variant="primary" lg block icon="image" iconSize={19} label="Create social post" onPress={() => nav.go('postSelect', { cid: c.id, caseId: cs.id })} />
      </ActionBar>
    </Screen>
  );
}
