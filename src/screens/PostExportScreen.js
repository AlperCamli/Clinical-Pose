// ============ NATURE — Create Post 5: Export / Share ============
import React from 'react';
import { View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { Screen, ScrollBody } from '../components/Screen';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import PostPreview from '../components/PostPreview';
import { TopBar, ActionBar, Card, Btn } from '../components/ui';
import { C, PAD } from '../theme';
import { useApp, useNav } from '../store';
import { captureAsset } from '../data/postCapture';
import { savePostToGallery } from '../data/posts';

// Off-screen render size (points). Captured & scaled up to POST_PX so the asset is
// crisp while the on-screen preview stays small. Text scales with the snapshot, so
// proportions match the visible preview.
const OFFSCREEN_PT = 360;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function PostExportScreen({ route }) {
  const params = route.params || {};
  const { store, t, toast } = useApp();
  const nav = useNav();
  const c = store.clients.find((x) => x.id === params.cid);
  const cs = c?.cases.find((x) => x.id === params.caseId);
  const cfg = params.cfg || {};
  const [busy, setBusy] = React.useState(false);
  const refs = React.useRef([]);

  // slides to export: carousel = one per selected angle; timeline mode forces the
  // timeline layout; otherwise a single slide for the first selected angle.
  const slides = React.useMemo(() => {
    const ids = cfg.sel?.length ? cfg.sel : [undefined];
    if (cfg.mode === 'carousel') return ids.map((aid) => ({ ...cfg, sel: aid ? [aid] : undefined }));
    const first = ids[0];
    return [{ ...cfg, sel: first ? [first] : undefined, template: cfg.mode === 'timeline' ? 'timeline' : cfg.template }];
  }, [cfg]);

  if (!c || !cs) return null;

  // snapshot every off-screen slide → array of file uris
  async function renderAll() {
    await wait(350); // let images/layout settle before the snapshot
    const uris = [];
    for (let i = 0; i < slides.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      uris.push(await captureAsset(refs.current[i], slides[i].format));
    }
    return uris;
  }

  function guard() {
    if (!c.consentSocial) { toast('Social consent required'); return false; }
    return true;
  }
  function onErr(e) {
    if (e?.message === 'capture-unavailable') toast('Rendering needs a dev build (not Expo Go)');
    else if (e?.message === 'no-media-permission') toast('Gallery permission needed');
    else toast('Something went wrong');
  }

  async function onSave() {
    if (busy || !guard()) return;
    setBusy(true);
    try {
      const uris = await renderAll();
      for (let i = 0; i < uris.length; i++) await savePostToGallery(uris[i]); // eslint-disable-line no-await-in-loop
      toast(uris.length > 1 ? `Saved ${uris.length} images` : 'Saved to gallery');
    } catch (e) { onErr(e); } finally { setBusy(false); }
  }

  async function onShare() {
    if (busy || !guard()) return;
    setBusy(true);
    try {
      const uris = await renderAll();
      if (!(await Sharing.isAvailableAsync())) { toast('Sharing unavailable'); return; }
      await Sharing.shareAsync(uris[0], { mimeType: 'image/jpeg', dialogTitle: 'Share post' });
      if (uris.length > 1) toast('Shared slide 1 · save the set to gallery for all');
    } catch (e) { onErr(e); } finally { setBusy(false); }
  }

  return (
    <Screen>
      <TopBar onBack={nav.back} title="Export" border />
      <ScrollBody contentStyle={{ paddingHorizontal: PAD, paddingTop: 10, paddingBottom: 8, alignItems: 'center' }}>
        {slides.length === 1 ? (
          <View style={{ paddingTop: 10, paddingBottom: 18 }}>
            <PostPreview cfg={slides[0]} t={t} c={c} cs={cs} size={slides[0].format === '9:16' ? 200 : 248} />
          </View>
        ) : (
          <ScrollBody horizontal style={{ flexGrow: 0, marginVertical: 14 }} contentStyle={{ gap: 10, paddingHorizontal: 2 }}>
            {slides.map((sl, i) => (
              <PostPreview key={i} cfg={sl} t={t} c={c} cs={cs} size={sl.format === '9:16' ? 150 : 190} />
            ))}
          </ScrollBody>
        )}

        <Card pad style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: C.okWash, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={20} color={C.ok} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt style={{ fontWeight: '600', fontSize: 14 }}>Ready to share</Txt>
            <Txt style={{ fontSize: 12, color: C.ink3 }}>
              {cfg.format} · {cfg.template} · eyes {cfg.privacy?.eyes}{slides.length > 1 ? ` · ${slides.length} slides` : ''}
            </Txt>
          </View>
        </Card>
      </ScrollBody>

      {/* OFF-SCREEN hi-fidelity copies that get snapshotted (kept out of view) */}
      <View style={{ position: 'absolute', left: -100000, top: 0 }} pointerEvents="none">
        {slides.map((sl, i) => (
          <View key={i} ref={(r) => { refs.current[i] = r; }} collapsable={false}>
            <PostPreview cfg={sl} t={t} c={c} cs={cs} size={OFFSCREEN_PT} />
          </View>
        ))}
      </View>

      <ActionBar>
        <View style={{ gap: 10 }}>
          <Btn variant="primary" lg block icon="image" iconSize={19} disabled={busy} label={busy ? 'Working…' : 'Save to gallery'} onPress={onSave} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Btn icon="share" iconSize={18} label="Share" disabled={busy} onPress={onShare} style={{ flex: 1 }} />
            <Btn icon="check" iconSize={18} label="Finish" disabled={busy} onPress={() => { toast('Done'); nav.popTo('timeline', { cid: c.id, caseId: cs.id }); }} style={{ flex: 1 }} />
          </View>
        </View>
      </ActionBar>
    </Screen>
  );
}
