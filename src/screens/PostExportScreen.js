// ============ NATURE — Create Post 5: Export / Share queue ============
import React from 'react';
import { View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Screen, ScrollBody } from '../components/Screen';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import PostPreview from '../components/PostPreview';
import { TopBar, ActionBar, Card, Btn, Tag, Chip, Sheet } from '../components/ui';
import { C, PAD } from '../theme';
import { useApp, useNav } from '../store';
import { captureAsset } from '../data/postCapture';
import { savePostToGallery, sharePostSet } from '../data/posts';
import { removeBg } from '../data/backgroundRemoval';
import { buildQueue, postToSlideCfg, beforeAfter, capturedSessions, DEFAULT_POST_PRIVACY, uid } from '../data/helpers';
import { buildMessage } from '../data/messages';
import { schedulePostReminder, NOTIFICATIONS_AVAILABLE } from '../data/notifications';
import { todayISO, addDaysISO, atTime, fmtTime } from '../data/clock';

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
  const [remindFor, setRemindFor] = React.useState(null); // post id awaiting a reminder time (E2)
  const refs = React.useRef({});
  const createdRef = React.useRef(false);

  const remindOptions = React.useMemo(() => {
    const today = todayISO();
    return [
      { label: 'Tonight 19:00', ms: atTime(today, '19:00') },
      { label: 'Tomorrow 12:00', ms: atTime(addDaysISO(today, 1), '12:00') },
      { label: 'Tomorrow 19:00', ms: atTime(addDaysISO(today, 1), '19:00') },
      { label: 'In 3 days 12:00', ms: atTime(addDaysISO(today, 3), '12:00') },
    ].filter((o) => o.ms > Date.now());
  }, []);

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

  // The source photo uris a slide will render (before/after + any timeline cells),
  // so we can compute their cut-outs up front for background removal.
  function slidePhotoUris(slide) {
    const aid = slide.angleId;
    if (!aid) return [];
    const { before, after } = beforeAfter(cs, aid);
    const sessions = [before, after, ...capturedSessions(cs, aid)].filter(Boolean);
    return sessions.map((sx) => sx?.photos?.[aid]?.uri).filter(Boolean);
  }

  async function renderPost(post) {
    // Warm the on-device background-removal cache for any slide that needs it, so
    // the off-screen <Photo> cut-outs are ready before the (deterministic) snapshot.
    const needBg = post.slides.filter((s) => s.privacy?.bgRemove);
    if (needBg.length) {
      const srcUris = [...new Set(needBg.flatMap(slidePhotoUris))];
      await Promise.all(srcUris.map((u) => removeBg(u)));
    }
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
      const { shared } = await sharePostSet(uris);
      store.markPostShared(c.id, cs.id, post.id);
      if (!shared) toast('Saved · sharing unavailable here');
      else if (uris.length > shared) toast(`Shared slide 1 · all ${uris.length} saved to gallery`);
      else toast(shared > 1 ? 'All slides shared' : 'Shared');
    } catch (e) { onErr(e); } finally { setBusy(null); }
  }

  // E2 — "remind me to post": a local notification that deep-links back here
  async function onRemind(whenMs) {
    const postId = remindFor;
    setRemindFor(null);
    if (!NOTIFICATIONS_AVAILABLE) { toast('Reminders need a dev build'); return; }
    const id = await schedulePostReminder({ cid: c.id, caseId: cs.id, postId }, whenMs);
    if (!id) { toast('Could not schedule (permission?)'); return; }
    store.schedulePost(c.id, cs.id, postId, whenMs, id);
    toast(`Reminder set · ${fmtTime(whenMs)}`);
  }

  async function copyCaption() {
    const caption = buildMessage('caption', { client: c, tid: cs.treatment, getSetting: store.getSetting });
    await Clipboard.setStringAsync(caption);
    toast('Caption copied');
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
            const live = cs.posts?.find((p) => p.id === post.id);
            const shared = liveStatus(post.id) === 'shared';
            const scheduled = !shared && !!live?.scheduledAt;
            const working = busy === post.id;
            return (
              <Card key={post.id} pad style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <PostPreview cfg={postToSlideCfg(post, 0)} t={t} c={c} cs={cs} size={post.format === '9:16' ? 86 : 108} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Txt style={{ fontWeight: '700', fontSize: 15, textTransform: 'capitalize' }}>{post.mode || 'single'}</Txt>
                      <Tag variant={shared ? 'ok' : scheduled ? 'warn' : 'accent'} dot>{shared ? 'Shared' : scheduled ? 'Scheduled' : 'Ready'}</Tag>
                    </View>
                    <Txt mono style={{ fontSize: 11.5, color: C.ink3 }}>
                      {post.format} · {post.slides.length > 1 ? `${post.slides.length} slides` : post.slides[0]?.template}
                    </Txt>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                      <Chip icon="bell" label={scheduled ? 'Reschedule' : 'Remind me'} onPress={() => setRemindFor(post.id)} />
                      <Chip icon="note" label="Caption" onPress={copyCaption} />
                    </View>
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

      <Sheet open={!!remindFor} onClose={() => setRemindFor(null)} title="Remind me to post">
        <Txt style={{ fontSize: 13, color: C.ink3, marginBottom: 14 }}>
          A notification will bring you back to this post at the chosen time.
        </Txt>
        <View style={{ gap: 8 }}>
          {remindOptions.map((o) => (
            <Btn key={o.label} variant="soft" block icon="bell" label={o.label} onPress={() => onRemind(o.ms)} />
          ))}
        </View>
      </Sheet>
    </Screen>
  );
}
