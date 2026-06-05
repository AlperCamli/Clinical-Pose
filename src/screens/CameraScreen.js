// ============ NATURE — Camera (classic overlay) with expo-camera ============
import React from 'react';
import { View, Pressable, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFaceDetection } from '../data/faceDetection';
import * as Haptics from 'expo-haptics';
import { detectEyes } from '../data/eyes';
import Svg, { Ellipse, Rect } from 'react-native-svg';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import Photo from '../components/Photo';
import { Btn, Tag, Chip } from '../components/ui';
import { Slider } from '../components/ui';
import { C } from '../theme';
import { useApp, useNav } from '../store';
import { TREATMENTS } from '../data/treatments';

// dashed alignment guide (generic / fallback ghost)
function GhostGuide() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Ellipse cx="50%" cy="52%" rx="23%" ry="33%" fill="none" stroke="rgba(120,180,255,0.85)" strokeWidth={2} strokeDasharray="7 7" />
      <Rect x="29%" y="40%" width="42%" height="9%" rx={5} fill="none" stroke="rgba(120,180,255,0.7)" strokeWidth={2} strokeDasharray="6 6" />
    </Svg>
  );
}

export default function CameraScreen({ route }) {
  const params = route.params || {};
  const { store, t, toast } = useApp();
  const nav = useNav();
  const c = store.clients.find((x) => x.id === params.cid);
  const cs = c.cases.find((x) => x.id === params.caseId);
  const s = cs.sessions.find((x) => x.id === params.sessionId);
  const angles = TREATMENTS[cs.treatment].angles;
  const isAfter = s.kind === 'after';

  const [permission, requestPermission] = useCameraPermissions();
  const faceDetector = useFaceDetection();
  const camRef = React.useRef(null);

  const [idx, setIdx] = React.useState(params.startIdx || 0);
  const [opacity, setOpacity] = React.useState(0.5);
  const [useGeneric, setUseGeneric] = React.useState(false);
  const [eyeHidden, setEyeHidden] = React.useState(c.eyeDefault !== 'visible');
  const [shot, setShot] = React.useState(null); // {aid, uri}
  const [facing, setFacing] = React.useState('back');
  const [busy, setBusy] = React.useState(false);

  const a = angles[idx];
  const overlayMode = isAfter && !useGeneric;

  // reference (ghost) photo for after-overlay
  const refSession = React.useMemo(() => {
    if (s.refSource === 'previous') {
      const i = cs.sessions.indexOf(s);
      return cs.sessions[i - 1];
    }
    return cs.sessions.find((x) => x.kind === 'before') || cs.sessions[0];
  }, [cs, s]);
  const refPhoto = overlayMode ? refSession?.photos[a.id] : null;
  const ghostUri = refPhoto?.uri || null;

  React.useEffect(() => { requestPermission?.(); }, []); // eslint-disable-line

  const nextMissing = () => {
    const after = angles.map((_, i) => i).slice(idx + 1).find((i) => angles[i].req && s.photos[angles[i].id]?.status !== 'captured');
    return after;
  };

  const capture = async () => {
    if (busy) return;
    setBusy(true);
    let uri;
    try {
      const p = await camRef.current?.takePictureAsync({ quality: 0.75, skipProcessing: true });
      uri = p?.uri;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) { /* simulator / no camera — continue without a real image */ }
    // Detect eyes once (on the cache file) so the review can preview redaction.
    // Nothing is saved to disk/gallery/DB yet — that happens on Keep.
    const eyes = await detectEyes(faceDetector, uri);
    setShot({ aid: a.id, uri, ...eyes });
    setBusy(false);
  };

  // Keep = commit: only now do we copy the file to private storage, mirror it to
  // the gallery, and write the DB row — so discarded/retaken shots are never saved.
  const keep = async () => {
    if (busy) return;
    setBusy(true);
    await store.capturePhoto(c.id, cs.id, s.id, a.id, {
      status: 'captured', uri: shot?.uri, eyeHidden,
      eyeBoxes: shot?.eyeBoxes, eyeDetected: shot?.eyeDetected, imgW: shot?.imgW, imgH: shot?.imgH,
    });
    setBusy(false);
    setShot(null);
    const nm = nextMissing();
    if (nm !== undefined) setIdx(nm);
    else { toast('Session captured'); nav.navigateOrReplace('sessionReview', params); }
  };
  // Retake = discard the pending shot. Nothing was persisted, so there's nothing to clean up.
  const retake = () => setShot(null);

  return (
    <View style={{ flex: 1, backgroundColor: '#0c0f14' }}>
      <StatusBar style="light" />

      {/* live camera */}
      {permission?.granted ? (
        <CameraView ref={camRef} style={StyleSheet.absoluteFill} facing={facing} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#13171e' }]} />
      )}

      {/* darken / overlay scrim region */}
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* top bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 }}>
          <CamBtn name="x" onPress={() => nav.back()} />
          <View style={{ alignItems: 'center' }}>
            <Txt style={{ fontWeight: '700', fontSize: 15, color: '#fff' }}>{a.name}</Txt>
            <Txt mono style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>{a.code} · {idx + 1}/{angles.length}</Txt>
          </View>
          <CamBtn name={eyeHidden ? 'eyeoff' : 'eye'} color={eyeHidden ? '#7fb2ff' : '#fff'} onPress={() => setEyeHidden((v) => !v)} />
        </View>

        {/* viewport overlays */}
        <View style={{ flex: 1, position: 'relative' }}>
          {/* ghost / guide */}
          {overlayMode && ghostUri && (
            <Image source={{ uri: ghostUri }} style={[StyleSheet.absoluteFill, { opacity }]} resizeMode="cover" />
          )}
          {overlayMode && ghostUri && (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(120,170,255,0.10)', opacity }]} />
          )}
          {(!isAfter || useGeneric || (overlayMode && !ghostUri)) && <GhostGuide />}

          {/* rule of thirds */}
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <View style={[grid.v, { left: '33.3%' }]} />
            <View style={[grid.v, { left: '66.6%' }]} />
            <View style={[grid.h, { top: '33.3%' }]} />
            <View style={[grid.h, { top: '66.6%' }]} />
          </View>

          {/* mode chip */}
          <View style={{ position: 'absolute', top: 12, left: 0, right: 0, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(12,15,20,0.7)', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8 }}>
              <Icon name={overlayMode ? 'layers' : 'align'} size={11} color="#fff" />
              <Txt mono style={{ fontSize: 10.5, fontWeight: '600', letterSpacing: 0.3, color: '#fff' }}>{overlayMode ? 'BEFORE OVERLAY' : 'GENERIC GUIDE'}</Txt>
            </View>
          </View>

          {/* reference thumbnail */}
          {overlayMode && (
            <View style={{ position: 'absolute', bottom: 12, left: 12 }}>
              <View style={{ width: 56, borderRadius: 10, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)' }}>
                <Photo eyeStyle={t.eyeStyle} uri={ghostUri} eyeBoxes={refPhoto?.eyeBoxes} imgW={refPhoto?.imgW} imgH={refPhoto?.imgH} variant="plain" style={{ height: 70, borderRadius: 0, borderWidth: 0 }} />
              </View>
              <Txt mono style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 3 }}>REFERENCE</Txt>
            </View>
          )}
        </View>

        {/* controls */}
        <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, backgroundColor: '#0c0f14' }}>
          {overlayMode && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <Icon name="layers" size={17} color="rgba(255,255,255,0.6)" />
              <Slider value={opacity} onChange={setOpacity} style={{ flex: 1 }} />
              <Txt mono style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', width: 34, textAlign: 'right' }}>{Math.round(opacity * 100)}%</Txt>
            </View>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <CamBtn name="flip" big onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))} />
            <Pressable onPress={capture} disabled={busy}
              style={{ width: 74, height: 74, borderRadius: 99, borderWidth: 4, borderColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' }}>
              {busy ? <ActivityIndicator color="#fff" /> : <View style={{ width: 58, height: 58, borderRadius: 99, backgroundColor: '#fff' }} />}
            </Pressable>
            <View style={{ width: 46, alignItems: 'flex-end' }}>
              {isAfter ? (
                <CamBtn name="align" big active={useGeneric} onPress={() => setUseGeneric((v) => !v)} />
              ) : <View style={{ width: 46 }} />}
            </View>
          </View>
          <Txt style={{ textAlign: 'center', marginTop: 12, fontSize: 11.5, color: 'rgba(255,255,255,0.4)' }}>
            {isAfter ? (useGeneric ? 'Generic guide — tap ⟂ to use the before photo' : 'Match the ghost of the previous photo, then capture') : 'Align inside the dashed guide, then capture'}
          </Txt>
        </View>
      </SafeAreaView>

      {/* permission prompt */}
      {!permission?.granted && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8,11,15,0.92)', alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
          <Icon name="camera" size={40} color="#7fb2ff" />
          <Txt style={{ color: '#fff', fontWeight: '700', fontSize: 17, marginTop: 16, textAlign: 'center' }}>Camera access needed</Txt>
          <Txt style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13.5, marginTop: 6, textAlign: 'center' }}>Nature uses the camera to capture standardized clinical angles.</Txt>
          <View style={{ height: 18 }} />
          <Btn variant="primary" icon="camera" label="Grant camera access" onPress={requestPermission} />
          <Pressable onPress={capture} style={{ marginTop: 14 }}>
            <Txt style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12.5 }}>Continue without camera (demo capture)</Txt>
          </Pressable>
        </View>
      )}

      {/* quick review overlay */}
      {shot && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8,11,15,0.95)' }]}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={{ paddingHorizontal: 16, paddingVertical: 14, alignItems: 'center' }}>
              <Txt style={{ fontWeight: '700', color: '#fff' }}>{a.name}</Txt>
              <Txt mono style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Captured · review</Txt>
            </View>
            <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: 'center' }}>
              <Photo angleCode={a.code} badge={isAfter ? 'AFTER' : 'BEFORE'} eyeHidden={eyeHidden} eyeStyle={t.eyeStyle} uri={shot.uri} eyeBoxes={shot.eyeBoxes} imgW={shot.imgW} imgH={shot.imgH} corners variant="plain" style={{ width: '100%', height: '72%', borderRadius: 16 }} />
            </View>
            <View style={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14 }}>
                <Chip onPress={() => setEyeHidden((v) => !v)} icon={eyeHidden ? 'eyeoff' : 'eye'} label={eyeHidden ? 'Eyes hidden' : 'Eyes visible'}
                  style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'transparent' }} textStyle={{ color: eyeHidden ? '#7fb2ff' : '#fff' }} />
                <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 7 }}>
                  <Txt mono style={{ fontSize: 10.5, fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>{t.eyeStyle.toUpperCase()}</Txt>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Btn icon="retake" iconSize={18} label="Retake" onPress={retake} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'transparent' }} color="#fff" />
                <Btn variant="primary" icon="check" iconSize={18} disabled={busy} label={`Keep ${nextMissing() !== undefined ? '& next' : '& finish'}`} onPress={keep} style={{ flex: 2 }} />
              </View>
            </View>
          </SafeAreaView>
        </View>
      )}
    </View>
  );
}

function CamBtn({ name, color = '#fff', big, active, onPress }) {
  const sz = big ? 46 : 38;
  return (
    <Pressable onPress={onPress} style={{ width: sz, height: sz, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? 'rgba(127,178,255,0.25)' : 'rgba(255,255,255,0.12)' }}>
      <Icon name={name} size={big ? 20 : 19} color={active ? '#7fb2ff' : color} />
    </Pressable>
  );
}

const grid = StyleSheet.create({
  v: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.12)' },
  h: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' },
});
