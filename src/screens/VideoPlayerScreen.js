// ============ NATURE — clinical video playback (expo-video) ============
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import { Sheet, Btn } from '../components/ui';
import { useApp, useNav } from '../store';

export default function VideoPlayerScreen({ route }) {
  const params = route.params || {};
  const { store, toast } = useApp();
  const nav = useNav();
  const c = store.clients.find((x) => x.id === params.cid);
  const cs = c?.cases.find((x) => x.id === params.caseId);
  const s = cs?.sessions.find((x) => x.id === params.sessionId);
  const video = s?.videos?.find((v) => v.id === params.videoId);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const player = useVideoPlayer(video?.uri || null, (p) => {
    p.loop = false;
    p.play();
  });

  if (!video) return null;

  const remove = () => {
    store.removeVideo(c.id, cs.id, s.id, video.id);
    toast('Video deleted');
    nav.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0c0f14' }}>
      <StatusBar style="light" />
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls />
      <SafeAreaView edges={['top']} pointerEvents="box-none" style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 6, gap: 10 }}>
          <Pressable onPress={nav.back} style={st.roundBtn}><Icon name="x" size={19} color="#fff" /></Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ backgroundColor: 'rgba(10,14,20,0.55)', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 99 }}>
              <Txt mono style={{ color: '#fff', fontSize: 12.5, fontWeight: '600' }}>{video.label || 'Clinical video'}</Txt>
            </View>
          </View>
          <Pressable onPress={() => setConfirmOpen(true)} style={st.roundBtn}><Icon name="trash" size={18} color="#ff8a8a" /></Pressable>
        </View>
      </SafeAreaView>

      <Sheet open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete video">
        <Txt style={{ fontSize: 13.5, marginBottom: 14 }}>This removes the clip from the session and deletes the private file.</Txt>
        <Btn variant="primary" block label="Delete video" style={{ backgroundColor: '#d4503c', borderColor: '#d4503c' }} onPress={remove} />
      </Sheet>
    </View>
  );
}

const st = StyleSheet.create({
  roundBtn: { width: 38, height: 38, borderRadius: 99, backgroundColor: 'rgba(10,14,20,0.55)', alignItems: 'center', justifyContent: 'center' },
});
