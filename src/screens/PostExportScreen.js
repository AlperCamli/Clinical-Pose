// ============ NATURE — Create Post 5: Export / Share queue ============
import React from 'react';
import { View } from 'react-native';
import { Screen, ScrollBody } from '../components/Screen';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import PostPreview from '../components/PostPreview';
import { TopBar, ActionBar, Card, Btn, Tag } from '../components/ui';
import { C, PAD } from '../theme';
import { useApp, useNav } from '../store';
import { captureAsset } from '../data/postCapture';
import { savePostToGallery, sharePost } from '../data/posts';
import { buildQueue, postToSlideCfg, DEFAULT_POST_PRIVACY, uid } from '../data/helpers';

// Off-screen render size (points). Captured & scaled up to POST_PX so the asset is
// crisp while the on-screen preview stays small.
const OFFSCREEN_PT = 360;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const slideKey = (pid, i) => `${pid}:${i}`;

export default function PostExportScreen({ route }) {
  const params = route.params || {};
  const { store, t, toast } = useApp();
  const nav = useNav();
  const c = store.clients.find((x) => x.id === params.cid);
  const cs = c?.cases.find((x) => x.id === params.caseId);
  const cfg = params.cfg || {};
  const [busy, setBusy] = React.useState(null); // post id (or 'all') currently working
  const refs = React.useRef({});
  const createdRef = React.useRef(false);

  // The share queue: carousel = one post (all slides); single/story = one per angle.
  const posts = React.useMemo(() => {
    return buildQueue(cfg).map((item) => ({
      id: uid(),
      caseId: params.caseId,
      mode: cfg.mode,
      format: cfg.format,
      slides: item.angles.map((a) => ({
        angleId: a,
        template: cfg.templates?.[a] ?? 'split',
        privacy: cfg.privacy?.[a] ?? DEFAULT_POST_PRIVACY,
      })),
      status: 'ready',
      createdAt: Date.now(),
    }));
  }, [cfg, params.caseId]);

  // Record every queued post as "ready" once, so unshared-but-prepared content
  // shows up in history immediately.
  React.useEffect(() => {
    if (createdRef.current || !c || !cs) return;
    createdRef.current = true;
    posts.forEach((p) => store.addPost(c.id, cs.id, p));
  }, [posts, c, cs, store]);

  if (!c || !cs) return null;

  const liveStatus = (pid) => cs.posts?.find((p) => p.id === pid)?.status || 'ready';
  const sharedCount = posts.filter((p) => liveStatus(p.id) === 'shared').length;

  function guard() {
    if (!c.consentSocial) { toast('Social consent required'); return false; }
    return true;
  }
  function onErr(e) {
    if (e?.message === 'capture-unavailable') toast('Rendering needs a dev build (not Expo Go)');
    else if (e?.message === 'no-media-permission') toast('Gallery permission needed');
    else toast('Something went wrong');
  }

  async function renderPost(post) {
    await wait(350); // let images/layout settle before the snapshot
    const uris = [];
    for (let i = 0; i < post.slides.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      uris.push(await captureAsset(refs.current[slideKey(post.id, i)], post.format));
    }
    return uris;
  }

  async function onShare(post) {
    if (busy || !guard()) return;
    setBusy(post.id);
    try {
      const uris = await renderPost(post);
      for (const u of uris) await savePostToGallery(u); // eslint-disable-line no-await-in-loop
      const ok = await sharePost(uris);
      store.markPostShared(c.id, cs.id, post.id);
      if (!ok) toast('Saved · sharing unavailable here');
      else toast(uris.length > 1 ? 'Shared slide 1 · set saved to gallery' : 'Shared');
    } catch (e) { onErr(e); } finally { setBusy(null); }
  }

  async function onSaveAll() {
    if (busy || !guard()) return;
    setBusy('all');
    try {
      let n = 0;
      for (const post of posts) {
        const uris = await renderPost(post); // eslint-disable-line no-await-in-loop
        for (const u of uris) { await savePostToGallery(u); n++; } // eslint-disable-line no-await-in-loop
      }
      toast(n > 1 ? `Saved ${n} images` : 'Saved to gallery');
    } catch (e) { onErr(e); } finally { setBusy(null); }
  }

  return (
    <Screen>
      <TopBar onBack={nav.back} title="Export" border right={<Tag variant="accent">{`${sharedCount}/${posts.length} shared`}</Tag>} />
      <ScrollBody contentStyle={{ paddingHorizontal: PAD, paddingTop: 10, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginHorizontal: 3, marginBottom: 12 }}>
          <Icon name="share" size={14} color={C.accent} style={{ marginTop: 1 }} />
          <Txt style={{ flex: 1, fontSize: 12.5, color: C.ink3 }}>
            {posts.length > 1 ? 'Share each post one by one — your queue is saved as you go.' : 'Ready to share.'}
          </Txt>
        </View>

        <View style={{ gap: 14 }}>
          {posts.map((post) => {
            const shared = liveStatus(post.id) === 'shared';
            const working = busy === post.id;
            return (
              <Card key={post.id} pad style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <PostPreview cfg={postToSlideCfg(post, 0)} t={t} c={c} cs={cs} size={post.format === '9:16' ? 86 : 108} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Txt style={{ fontWeight: '700', fontSize: 15, textTransform: 'capitalize' }}>{post.mode || 'single'}</Txt>
                      <Tag variant={shared ? 'ok' : 'accent'} dot>{shared ? 'Shared' : 'Ready'}</Tag>
                    </View>
                    <Txt mono style={{ fontSize: 11.5, color: C.ink3 }}>
                      {post.format} · {post.slides.length > 1 ? `${post.slides.length} slides` : post.slides[0]?.template}
                    </Txt>
                  </View>
                </View>
                <Btn variant={shared ? 'default' : 'primary'} icon="share" iconSize={18} disabled={!!busy} label={working ? 'Working…' : shared ? 'Share again' : 'Share'} onPress={() => onShare(post)} />
              </Card>
            );
          })}
        </View>

        <Btn variant="soft" icon="image" iconSize={18} disabled={!!busy} label={busy === 'all' ? 'Saving…' : 'Save all to gallery'} onPress={onSaveAll} style={{ marginTop: 16 }} />
        <Btn variant="ghost" icon="clock" iconSize={18} label="View social media history" onPress={() => nav.go('postHistory', { cid: c.id, caseId: cs.id })} style={{ marginTop: 8 }} />
      </ScrollBody>

      {/* OFF-SCREEN hi-fidelity copies that get snapshotted (kept out of view) */}
      <View style={{ position: 'absolute', left: -100000, top: 0 }} pointerEvents="none">
        {posts.map((post) => post.slides.map((s, i) => (
          <View key={slideKey(post.id, i)} ref={(r) => { refs.current[slideKey(post.id, i)] = r; }} collapsable={false}>
            <PostPreview cfg={postToSlideCfg(post, i)} t={t} c={c} cs={cs} size={OFFSCREEN_PT} />
          </View>
        )))}
      </View>

      <ActionBar>
        <Btn variant="primary" lg block icon="check" iconSize={19} label="Finish" disabled={!!busy} onPress={() => { toast('Done'); nav.popTo('timeline', { cid: c.id, caseId: cs.id }); }} />
      </ActionBar>
    </Screen>
  );
}
