// ============ NATURE — Social media post detail / re-share ============
import React from 'react';
import { View, ScrollView } from 'react-native';
import { Screen, ScrollBody } from '../components/Screen';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import PostPreview from '../components/PostPreview';
import { TopBar, ActionBar, Card, Btn, Tag } from '../components/ui';
import { C, PAD } from '../theme';
import { useApp, useNav } from '../store';
import { captureAsset } from '../data/postCapture';
import { savePostToGallery, sharePost } from '../data/posts';
import { postToSlideCfg } from '../data/helpers';

const OFFSCREEN_PT = 360;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const fmtTs = (ts) => (ts ? new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

export default function PostDetailScreen({ route }) {
  const params = route.params || {};
  const { store, t, toast } = useApp();
  const nav = useNav();
  const c = store.clients.find((x) => x.id === params.cid);
  const cs = c?.cases.find((x) => x.id === params.caseId);
  const post = cs?.posts?.find((p) => p.id === params.postId);
  const [busy, setBusy] = React.useState(null); // 'share' | 'save'
  const refs = React.useRef([]);

  if (!c || !cs || !post) return null;
  const shared = post.status === 'shared';
  const ONSCREEN = post.format === '9:16' ? 180 : 240;

  function guard() {
    if (!c.consentSocial) { toast('Social consent required'); return false; }
    return true;
  }
  function onErr(e) {
    if (e?.message === 'capture-unavailable') toast('Rendering needs a dev build (not Expo Go)');
    else if (e?.message === 'no-media-permission') toast('Gallery permission needed');
    else toast('Something went wrong');
  }
  async function render() {
    await wait(350);
    const uris = [];
    for (let i = 0; i < post.slides.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      uris.push(await captureAsset(refs.current[i], post.format));
    }
    return uris;
  }

  async function onShare() {
    if (busy || !guard()) return;
    setBusy('share');
    try {
      const uris = await render();
      for (const u of uris) await savePostToGallery(u); // eslint-disable-line no-await-in-loop
      const ok = await sharePost(uris);
      store.markPostShared(c.id, cs.id, post.id);
      if (!ok) toast('Saved · sharing unavailable here');
      else toast(uris.length > 1 ? 'Shared slide 1 · set saved to gallery' : 'Shared');
    } catch (e) { onErr(e); } finally { setBusy(null); }
  }
  async function onSave() {
    if (busy || !guard()) return;
    setBusy('save');
    try {
      const uris = await render();
      for (const u of uris) await savePostToGallery(u); // eslint-disable-line no-await-in-loop
      toast(uris.length > 1 ? `Saved ${uris.length} images` : 'Saved to gallery');
    } catch (e) { onErr(e); } finally { setBusy(null); }
  }

  return (
    <Screen>
      <TopBar onBack={nav.back} title="Post" sub={c.name} border right={<Tag variant={shared ? 'ok' : 'accent'} dot>{shared ? 'Shared' : 'Ready'}</Tag>} />
      <ScrollBody contentStyle={{ paddingHorizontal: PAD, paddingTop: 12, paddingBottom: 8, alignItems: 'center' }}>
        {post.slides.length > 1 ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, width: ONSCREEN }}>
            {post.slides.map((s, i) => (
              <View key={i} style={{ width: ONSCREEN }}>
                <PostPreview cfg={postToSlideCfg(post, i)} t={t} c={c} cs={cs} size={ONSCREEN} />
              </View>
            ))}
          </ScrollView>
        ) : (
          <PostPreview cfg={postToSlideCfg(post, 0)} t={t} c={c} cs={cs} size={ONSCREEN} />
        )}

        <Card pad style={{ width: '100%', marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: shared ? C.okWash : C.accentWash, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={shared ? 'check' : 'image'} size={20} color={shared ? C.ok : C.accentInk} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt style={{ fontWeight: '600', fontSize: 14, textTransform: 'capitalize' }}>{post.mode || 'single'} · {post.format}</Txt>
            <Txt style={{ fontSize: 12, color: C.ink3 }}>
              {post.slides.length > 1 ? `${post.slides.length} slides · ` : ''}{shared ? `Shared ${fmtTs(post.sharedAt)}` : `Ready ${fmtTs(post.createdAt)}`}
            </Txt>
          </View>
        </Card>
      </ScrollBody>

      {/* OFF-SCREEN hi-fidelity copies that get snapshotted */}
      <View style={{ position: 'absolute', left: -100000, top: 0 }} pointerEvents="none">
        {post.slides.map((s, i) => (
          <View key={i} ref={(r) => { refs.current[i] = r; }} collapsable={false}>
            <PostPreview cfg={postToSlideCfg(post, i)} t={t} c={c} cs={cs} size={OFFSCREEN_PT} />
          </View>
        ))}
      </View>

      <ActionBar>
        <View style={{ gap: 10 }}>
          <Btn variant="primary" lg block icon="share" iconSize={19} disabled={!!busy} label={busy === 'share' ? 'Working…' : shared ? 'Share again' : 'Share'} onPress={onShare} />
          <Btn icon="image" iconSize={18} disabled={!!busy} label={busy === 'save' ? 'Saving…' : 'Save to gallery'} onPress={onSave} />
        </View>
      </ActionBar>
    </Screen>
  );
}
