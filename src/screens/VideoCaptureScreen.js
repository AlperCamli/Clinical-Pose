// ============ NATURE — guided video capture (clinical documentation) ============
// Records a standardized "turn" clip for a session. The per-step guide overlay
// and prompts are drawn over the live preview but are NOT part of the recorded
// file — the saved clip is clean clinical footage. Videos are documentation
// only in this release: no redaction-on-video and no social export.
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import GuideOverlay from '../components/GuideOverlay';
import { Steps, Btn, Tag } from '../components/ui';
import { C } from '../theme';
import { useApp, useNav } from '../store';
import { TREATMENTS } from '../data/treatments';
import { uid } from '../data/helpers';
import { guidedSequence } from '../data/videoGuides';
import { persistVideo } from '../data/videos';

const MAX_SEC = 60;
const fmtSec = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function VideoCaptureScreen({ route }) {
  const params = route.params || {};
  const { store, toast } = useApp();
  const nav = useNav();
  const c = store.clients.find((x) => x.id === params.cid);
  const cs = c?.cases.find((x) => x.id === params.caseId);
  const camRef = React.useRef(null);
  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [micPerm, requestMicPerm] = useMicrophonePermissions();
  const [facing, setFacing] = React.useState('back');
  const [recording, setRecording] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [stepIdx, setStepIdx] = React.useState(0);
  const [stepLeft, setStepLeft] = React.useState(0);
  const [staged, setStaged] = React.useState(null); // { uri, durationSec }
  const [busy, setBusy] = React.useState(false);
  const elapsedRef = React.useRef(0);
  const recordingRef = React.useRef(false);

  React.useEffect(() => {
    requestCamPerm?.();
    requestMicPerm?.();
    // stop cleanly if the doctor backs out mid-recording
    return () => { if (recordingRef.current) camRef.current?.stopRecording(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const steps = React.useMemo(() => (cs ? guidedSequence(cs.treatment) : []), [cs]);

  // one ticking clock drives both the elapsed timer and the step countdown
  React.useEffect(() => {
    if (!recording) return undefined;
    const t = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      setStepLeft((left) => {
        if (left > 1) return left - 1;
        setStepIdx((i) => {
          if (i + 1 < steps.length) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setStepLeft(steps[i + 1].sec);
            return i + 1;
          }
          return i; // sequence done — keep the last guide up until Stop
        });
        return 0;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [recording, steps]);

  if (!c || !cs) return null;
  const T = TREATMENTS[cs.treatment];
  const step = steps[stepIdx];
  const sequenceDone = stepIdx === steps.length - 1 && stepLeft === 0;

  const start = async () => {
    if (recording || staged || busy) return;
    elapsedRef.current = 0;
    setElapsed(0);
    setStepIdx(0);
    setStepLeft(steps[0]?.sec || 0);
    setRecording(true);
    recordingRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      const res = await camRef.current?.recordAsync({ maxDuration: MAX_SEC });
      if (res?.uri) setStaged({ uri: res.uri, durationSec: Math.max(elapsedRef.current, 1) });
    } catch {
      toast('Recording unavailable here');
    } finally {
      recordingRef.current = false;
      setRecording(false);
    }
  };

  const stop = () => camRef.current?.stopRecording();

  const keep = async () => {
    if (busy || !staged) return;
    setBusy(true);
    try {
      const saved = await persistVideo(staged.uri, { clientId: c.id, caseId: cs.id, sessionId: params.sessionId });
      store.addVideo(c.id, cs.id, params.sessionId, {
        id: uid(), label: `${T.short} — guided video`, uri: saved.uri, videoKey: saved.videoKey,
        galleryAssetId: saved.galleryAssetId, galleryUri: saved.galleryUri,
        durationSec: staged.durationSec, createdAt: Date.now(),
      });
      toast('Video saved');
      nav.back();
    } catch {
      toast('Could not save the video');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0c0f14' }}>
      <StatusBar style="light" />
      {camPerm?.granted ? (
        <CameraView ref={camRef} style={StyleSheet.absoluteFill} facing={facing} mode="video" videoQuality="1080p" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#13171e' }]} />
      )}

      {/* live guide (on-screen only — never in the recorded file) */}
      {!staged && step?.overlay && <GuideOverlay overlay={step.overlay} mirror={facing === 'front'} />}

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* top bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 6, gap: 10 }}>
          <Pressable onPress={nav.back} style={st.roundBtn}><Icon name="x" size={19} color="#fff" /></Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(10,14,20,0.55)', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 99 }}>
              {recording && <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: '#ff5a5a' }} />}
              <Txt mono style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>
                {recording ? fmtSec(elapsed) : staged ? `${fmtSec(staged.durationSec)} recorded` : 'GUIDED VIDEO'}
              </Txt>
            </View>
          </View>
          <Pressable onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))} style={st.roundBtn}>
            <Icon name="flip" size={18} color="#fff" />
          </Pressable>
        </View>

        {!micPerm?.granted && !staged && (
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <Tag variant="warn">NO MICROPHONE — VIDEO WILL BE SILENT</Tag>
          </View>
        )}

        <View style={{ flex: 1 }} />

        {/* step prompt + progress */}
        {!staged && steps.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
            <View style={{ backgroundColor: 'rgba(10,14,20,0.65)', borderRadius: 16, padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Txt style={{ color: '#fff', fontWeight: '700', fontSize: 15.5 }}>
                    {recording ? (sequenceDone ? 'Done — stop when ready' : step.label) : `${T.name} — ${steps.length}-step turn`}
                  </Txt>
                  <Txt mono style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11.5, marginTop: 2 }}>
                    {recording ? step.sub || '' : 'Press record; prompts advance automatically'}
                  </Txt>
                </View>
                {recording && !sequenceDone && (
                  <Txt mono style={{ color: '#fff', fontWeight: '600', fontSize: 24 }}>{stepLeft}</Txt>
                )}
              </View>
              <View style={{ marginTop: 10 }}>
                <Steps n={steps.length} cur={recording ? stepIdx : -1} />
              </View>
            </View>
          </View>
        )}

        {/* controls */}
        <View style={{ alignItems: 'center', paddingBottom: 34 }}>
          {staged ? (
            <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20 }}>
              <Btn variant="default" icon="retake" label="Retake" style={{ flex: 1 }} disabled={busy}
                onPress={() => setStaged(null)} />
              <Btn variant="primary" icon="check" label={busy ? 'Saving…' : 'Keep video'} style={{ flex: 1.4 }} disabled={busy}
                onPress={keep} />
            </View>
          ) : (
            <Pressable onPress={recording ? stop : start} style={[st.shutter, recording && { borderColor: '#ff5a5a' }]}>
              <View style={recording ? st.stopSquare : st.recDot} />
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  roundBtn: { width: 38, height: 38, borderRadius: 99, backgroundColor: 'rgba(10,14,20,0.55)', alignItems: 'center', justifyContent: 'center' },
  shutter: { width: 74, height: 74, borderRadius: 99, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  recDot: { width: 54, height: 54, borderRadius: 99, backgroundColor: '#ff5a5a' },
  stopSquare: { width: 28, height: 28, borderRadius: 6, backgroundColor: '#ff5a5a' },
});
