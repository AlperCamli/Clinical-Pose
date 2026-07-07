// ============ NATURE — Presentation mode (consult-room smart TV) ============
// A patient-safe, full-screen before/after slideshow designed to be mirrored
// to a TV (AirPlay / Google Home / Miracast — no casting SDK needed). Privacy
// rules are hard-coded: eye redaction is ALWAYS forced and no client name or
// code is ever rendered — only the treatment and BEFORE/AFTER labels. The
// screen locks to landscape and keeps the display awake while presenting.
import React from 'react';
import { View, FlatList, Pressable, Animated, useWindowDimensions, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import * as ScreenOrientation from 'expo-screen-orientation';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import Photo from '../components/Photo';
import { useApp, useNav } from '../store';
import { TREATMENTS } from '../data/treatments';
import { beforeAfter, capturedSessions, fmtDate } from '../data/helpers';

const ADVANCE_MS = 6000;
const FADE_AFTER_MS = 3000;
const IS_TABLET = Math.min(Dimensions.get('window').width, Dimensions.get('window').height) >= 768;

export default function PresentationScreen({ route }) {
  const params = route.params || {};
  const { store, t } = useApp();
  const nav = useNav();
  const { width, height } = useWindowDimensions();
  const c = store.clients.find((x) => x.id === params.cid);
  const cs = c?.cases.find((x) => x.id === params.caseId);
  const listRef = React.useRef(null);
  const [idx, setIdx] = React.useState(0);
  const [playing, setPlaying] = React.useState(true);
  const [controls, setControls] = React.useState(true);
  const fade = React.useRef(new Animated.Value(1)).current;
  const fadeTimer = React.useRef();

  useKeepAwake();

  React.useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    return () => {
      (IS_TABLET
        ? ScreenOrientation.unlockAsync()
        : ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)
      ).catch(() => {});
    };
  }, []);

  const slides = React.useMemo(() => {
    if (!cs) return [];
    return TREATMENTS[cs.treatment].angles
      .filter((a) => capturedSessions(cs, a.id).length >= 1)
      .map((a) => ({ angle: a, ...beforeAfter(cs, a.id) }));
  }, [cs]);

  // auto-advance (wraps)
  React.useEffect(() => {
    if (!playing || slides.length < 2) return undefined;
    const timer = setInterval(() => {
      setIdx((i) => {
        const next = (i + 1) % slides.length;
        listRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, ADVANCE_MS);
    return () => clearInterval(timer);
  }, [playing, slides.length]);

  // controls auto-hide
  const showControls = React.useCallback(() => {
    setControls(true);
    Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    clearTimeout(fadeTimer.current);
    fadeTimer.current = setTimeout(() => {
      Animated.timing(fade, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => setControls(false));
    }, FADE_AFTER_MS);
  }, [fade]);
  React.useEffect(() => {
    showControls();
    return () => clearTimeout(fadeTimer.current);
  }, [showControls]);

  if (!c || !cs) return null;
  const T = TREATMENTS[cs.treatment];

  const ph = (s, aid) => {
    const p = s?.photos?.[aid];
    return { uri: p?.uri, eyeBoxes: p?.eyeBoxes, imgW: p?.imgW, imgH: p?.imgH, fileMissing: p?.fileMissing };
  };

  const renderSlide = ({ item }) => {
    const aid = item.angle.id;
    return (
      <View style={{ width, height, backgroundColor: '#000', paddingHorizontal: width * 0.05, paddingVertical: height * 0.08 }}>
        <View style={{ flex: 1, flexDirection: 'row', gap: 14 }}>
          {[['BEFORE', item.before], ['AFTER', item.after]].map(([label, session]) => (
            <View key={label} style={{ flex: 1 }}>
              {/* eyeHidden is FORCED — presentation mode never shows identity */}
              <Photo
                eyeHidden eyeStyle={t.eyeStyle} {...ph(session, aid)} variant="plain"
                style={{ flex: 1, height: '100%', borderRadius: 18, borderWidth: 0 }}
              />
              <View style={{ position: 'absolute', top: 14, left: 14, backgroundColor: label === 'AFTER' ? 'rgba(16,155,106,0.9)' : 'rgba(20,28,38,0.75)', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 9 }}>
                <Txt mono style={{ color: '#fff', fontSize: 13, fontWeight: '600', letterSpacing: 1 }}>{label}</Txt>
              </View>
              {session?.date && (
                <View style={{ position: 'absolute', bottom: 14, left: 14, backgroundColor: 'rgba(20,28,38,0.6)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 }}>
                  <Txt mono style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11.5 }}>{fmtDate(session.date)}</Txt>
                </View>
              )}
            </View>
          ))}
        </View>
        <View style={{ alignItems: 'center', marginTop: height * 0.03 }}>
          <Txt style={{ color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: -0.4 }}>{T.name}</Txt>
          <Txt mono style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 4, letterSpacing: 1 }}>
            {item.angle.name.toUpperCase()}
          </Txt>
        </View>
      </View>
    );
  };

  return (
    <Pressable style={{ flex: 1, backgroundColor: '#000' }} onPress={showControls}>
      <StatusBar hidden />
      {slides.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Txt style={{ color: 'rgba(255,255,255,0.7)', fontSize: 17, fontWeight: '600' }}>No captured photos to present yet</Txt>
          <Pressable onPress={nav.back} style={{ marginTop: 18, paddingVertical: 10, paddingHorizontal: 22, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)' }}>
            <Txt style={{ color: '#fff', fontWeight: '600' }}>Close</Txt>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            ref={listRef}
            data={slides}
            keyExtractor={(s) => s.angle.id}
            renderItem={renderSlide}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / width))}
          />
          <Animated.View pointerEvents={controls ? 'auto' : 'none'} style={{ position: 'absolute', top: 0, left: 0, right: 0, opacity: fade }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingTop: 18, gap: 12 }}>
              <Pressable onPress={nav.back} style={ctl}>
                <Icon name="x" size={20} color="#fff" />
              </Pressable>
              <View style={{ flex: 1 }} />
              <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                {slides.map((_, i) => (
                  <View key={i} style={{ width: i === idx ? 18 : 7, height: 7, borderRadius: 99, backgroundColor: i === idx ? '#fff' : 'rgba(255,255,255,0.35)' }} />
                ))}
              </View>
              <View style={{ flex: 1 }} />
              <Pressable onPress={() => { setPlaying((p) => !p); showControls(); }} style={ctl}>
                <Icon name={playing ? 'pause' : 'play'} size={19} color="#fff" />
              </Pressable>
            </View>
          </Animated.View>
        </>
      )}
    </Pressable>
  );
}

const ctl = { width: 42, height: 42, borderRadius: 99, backgroundColor: 'rgba(20,28,38,0.6)', alignItems: 'center', justifyContent: 'center' };
