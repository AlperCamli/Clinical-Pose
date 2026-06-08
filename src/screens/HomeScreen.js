// ============ NATURE — Home / Dashboard (spotlight variant) ============
import React from 'react';
import { View, Pressable } from 'react-native';
import { Screen, ScrollBody, Spread } from '../components/Screen';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import TGlyph from '../components/TGlyph';
import PostPreview from '../components/PostPreview';
import { Card, Avatar, Tag, SecLabel, IconBtn } from '../components/ui';
import { C, PAD, shadowBtn } from '../theme';
import { useApp, useNav } from '../store';
import { TREATMENTS } from '../data/treatments';
import { RECENT } from '../data/seed';
import { capCount, fmtDate, postToSlideCfg } from '../data/helpers';

const fmtTs = (ts) => (ts ? new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '');

export default function HomeScreen() {
  const { store, t } = useApp();
  const nav = useNav();

  const active = [];
  store.clients.forEach((c) =>
    c.cases.forEach((cs) => {
      if (!cs.sessions.length) return; // skip cases with no captured session yet
      active.push({ c, cs, last: cs.sessions[cs.sessions.length - 1] });
    })
  );

  const socialPosts = [];
  store.clients.forEach((c) =>
    c.cases.forEach((cs) => (cs.posts || []).forEach((post) => socialPosts.push({ c, cs, post })))
  );
  socialPosts.sort((a, b) => (b.post.createdAt || 0) - (a.post.createdAt || 0));
  const recentPosts = socialPosts.slice(0, 4);

  const startCase = () => nav.go('treatmentPicker', {});
  const findClient = () => nav.go('clientSearch', { mode: 'find' });

  return (
    <Screen>
      <ScrollBody contentStyle={{ paddingBottom: 12 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: PAD, paddingTop: 8, paddingBottom: 4 }}>
          <Spread>
            <IconBtn name="cloud" size={22} color={C.ok} bare onPress={() => nav.go('sync')} accessibilityLabel="Sync" />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 24, height: 24, borderRadius: 7, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="camera" size={14} color="#fff" />
              </View>
              <Txt style={{ fontWeight: '700', letterSpacing: -0.2 }}>Nature</Txt>
            </View>
            <IconBtn name="settings" size={21} color={C.ink2} bare onPress={() => nav.go('settings')} accessibilityLabel="Settings" />
          </Spread>
        </View>

        {/* Greeting */}
        <View style={{ paddingHorizontal: PAD, paddingTop: 10, paddingBottom: 4 }}>
          <Txt style={{ fontSize: 13.5, fontWeight: '600', color: C.ink3 }}>Thursday · 4 June</Txt>
          <Txt style={{ fontSize: 25, fontWeight: '800', letterSpacing: -0.5, marginTop: 2 }}>Good morning, Dr. Demir</Txt>
        </View>

        {/* Two CTAs */}
        <View style={{ paddingHorizontal: PAD, paddingTop: 14, paddingBottom: 6, flexDirection: 'row', gap: 12 }}>
          <Pressable
            onPress={startCase}
            style={[{ flex: 1, borderRadius: 18, padding: PAD, backgroundColor: C.accent, minHeight: 128, justifyContent: 'space-between' }, shadowBtn]}
          >
            <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="plus" size={24} color="#fff" />
            </View>
            <View>
              <Txt style={{ fontWeight: '700', fontSize: 16.5, color: '#fff' }}>Start New Case</Txt>
              <Txt style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: 3, fontWeight: '500' }}>Capture baseline before photos</Txt>
            </View>
          </Pressable>
          <Card onPress={findClient} pad style={{ flex: 1, minHeight: 128, justifyContent: 'space-between' }}>
            <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: C.accentWash, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="search" size={22} color={C.accentInk} />
            </View>
            <View>
              <Txt style={{ fontWeight: '700', fontSize: 16.5 }}>Find Client</Txt>
              <Txt style={{ fontSize: 12.5, color: C.ink3, marginTop: 3, fontWeight: '500' }}>Add an after / follow-up session</Txt>
            </View>
          </Card>
        </View>

        {/* Active cases */}
        <View style={{ paddingHorizontal: PAD, paddingTop: 16, paddingBottom: 6 }}>
          <Spread style={{ marginBottom: 10 }}>
            <SecLabel style={{ margin: 0 }}>Active cases</SecLabel>
            <Tag>{String(active.length)}</Tag>
          </Spread>
          <View style={{ gap: 10 }}>
            {active.slice(0, 3).map((a, i) => <ActiveCard key={i} {...a} nav={nav} />)}
          </View>
        </View>

        {/* Recent social media contents */}
        <View style={{ paddingHorizontal: PAD, paddingTop: 16, paddingBottom: 6 }}>
          <SecLabel>Recent Social Media Contents</SecLabel>
          {recentPosts.length === 0 ? (
            <Card pad>
              <Txt style={{ fontSize: 12.5, color: C.ink3 }}>Posts you create from a case will appear here — both shared and ready to share.</Txt>
            </Card>
          ) : (
            <Card>
              {recentPosts.map(({ c, cs, post }, i) => <PostRow key={post.id} c={c} cs={cs} post={post} t={t} first={i === 0} nav={nav} />)}
            </Card>
          )}
        </View>

        {/* Recent sessions */}
        <View style={{ paddingHorizontal: PAD, paddingTop: 14, paddingBottom: 22 }}>
          <SecLabel>Recent sessions</SecLabel>
          <Card>
            {RECENT.map((r, i) => <RecentRow key={i} r={r} first={i === 0} nav={nav} />)}
          </Card>
        </View>
      </ScrollBody>
    </Screen>
  );
}

function ActiveCard({ c, cs, last, nav }) {
  const T = TREATMENTS[cs.treatment];
  const { got, total } = capCount(last, cs.treatment);
  return (
    <Card onPress={() => nav.go('timeline', { cid: c.id, caseId: cs.id })} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13, paddingHorizontal: 14 }}>
      <Avatar initials={c.initials} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Txt style={{ fontWeight: '700', fontSize: 15.5 }}>{c.name}</Txt>
          <Tag variant="accent">{T.short}</Tag>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <Txt mono style={{ fontSize: 12.5, color: C.ink3 }}>{cs.sessions.length} sessions</Txt>
          <Txt style={{ fontSize: 12.5, color: C.ink3 }} numberOfLines={1}>· last: {last.label} · {fmtDate(last.date)}</Txt>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 5 }}>
        <Txt mono style={{ fontSize: 12, fontWeight: '600', color: got < total ? C.warn : C.ok }}>{got}/{total}</Txt>
        <Icon name="chevR" size={17} color={C.ink3} />
      </View>
    </Card>
  );
}

function PostRow({ c, cs, post, t, first, nav }) {
  const shared = post.status === 'shared';
  return (
    <Pressable
      onPress={() => nav.go('postDetail', { cid: c.id, caseId: cs.id, postId: post.id })}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: PAD, borderTopWidth: first ? 0 : 1, borderTopColor: C.line }}
    >
      <PostPreview cfg={postToSlideCfg(post, 0)} t={t} c={c} cs={cs} size={post.format === '9:16' ? 40 : 52} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Txt style={{ fontWeight: '600', fontSize: 14.5 }} numberOfLines={1}>{c.name}</Txt>
          <Tag variant={shared ? 'ok' : 'accent'} dot>{shared ? 'Shared' : 'Ready'}</Tag>
        </View>
        <Txt style={{ fontSize: 12, color: C.ink3 }} numberOfLines={1}>{TREATMENTS[cs.treatment].name} · {post.mode || 'single'}</Txt>
      </View>
      <Txt mono style={{ fontSize: 11.5, color: C.ink3 }}>{fmtTs(shared ? post.sharedAt : post.createdAt)}</Txt>
    </Pressable>
  );
}

function RecentRow({ r, first, nav }) {
  return (
    <Pressable
      onPress={() => nav.go('clientProfile', { cid: r.cid })}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13, paddingHorizontal: PAD, borderTopWidth: first ? 0 : 1, borderTopColor: C.line }}
    >
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' }}>
        <TGlyph tid={r.treatment} size={19} color={C.ink2} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt style={{ fontWeight: '600', fontSize: 14.5 }}>{r.client}</Txt>
        <Txt style={{ fontSize: 12, color: C.ink3 }} numberOfLines={1}>{TREATMENTS[r.treatment].name} · {r.label}</Txt>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Txt mono style={{ fontSize: 11.5, color: C.ink3 }}>{r.when}</Txt>
        <Txt mono style={{ fontSize: 11.5, color: C.ok, marginTop: 2 }}>{r.cap}</Txt>
      </View>
    </Pressable>
  );
}
