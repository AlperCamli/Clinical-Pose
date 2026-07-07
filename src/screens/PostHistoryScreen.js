// ============ NATURE — Social media post history (per case) ============
import React from 'react';
import { View } from 'react-native';
import { Screen, ScrollBody } from '../components/Screen';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import PostPreview from '../components/PostPreview';
import { TopBar, Card, Tag } from '../components/ui';
import { C, PAD } from '../theme';
import { useApp, useNav } from '../store';
import { postToSlideCfg } from '../data/helpers';

const fmtTs = (ts) => (ts ? new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '');

export default function PostHistoryScreen({ route }) {
  const params = route.params || {};
  const { store, t } = useApp();
  const nav = useNav();
  const c = store.clients.find((x) => x.id === params.cid);
  const cs = c?.cases.find((x) => x.id === params.caseId);
  if (!cs) return null;
  const posts = cs.posts || [];

  return (
    <Screen>
      <TopBar onBack={nav.back} title="Social media posts" sub={c.name} border />
      <ScrollBody contentStyle={{ paddingHorizontal: PAD, paddingTop: 14, paddingBottom: 16 }}>
        {posts.length === 0 ? (
          <Card pad style={{ alignItems: 'center', gap: 8, paddingVertical: 28 }}>
            <Icon name="image" size={26} color={C.ink3} />
            <Txt style={{ fontWeight: '600', fontSize: 14.5 }}>No posts yet</Txt>
            <Txt style={{ fontSize: 12.5, color: C.ink3, textAlign: 'center' }}>Create a social post from a session to see it here.</Txt>
          </Card>
        ) : (
          <View style={{ gap: 11 }}>
            {posts.map((post) => {
              const shared = post.status === 'shared';
              const scheduled = !shared && !!post.scheduledAt;
              return (
                <Card key={post.id} onPress={() => nav.go('postDetail', { cid: c.id, caseId: cs.id, postId: post.id })}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 12 }}>
                  <PostPreview cfg={postToSlideCfg(post, 0)} t={t} c={c} cs={cs} size={post.format === '9:16' ? 56 : 72} bare />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Txt style={{ fontWeight: '700', fontSize: 15, textTransform: 'capitalize' }}>{post.mode || 'single'}</Txt>
                      <Tag variant={shared ? 'ok' : scheduled ? 'warn' : 'accent'} dot>{shared ? 'Shared' : scheduled ? 'Scheduled' : 'Ready'}</Tag>
                    </View>
                    <Txt mono style={{ fontSize: 11.5, color: C.ink3, marginTop: 3 }}>
                      {post.format} · {post.slides.length > 1 ? `${post.slides.length} slides` : '1 slide'} · {shared ? `shared ${fmtTs(post.sharedAt)}` : `ready ${fmtTs(post.createdAt)}`}
                    </Txt>
                  </View>
                  <Icon name="chevR" size={17} color={C.ink3} />
                </Card>
              );
            })}
          </View>
        )}
      </ScrollBody>
    </Screen>
  );
}
