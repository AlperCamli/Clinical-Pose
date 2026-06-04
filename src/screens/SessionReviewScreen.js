// ============ NATURE — Session Review ============
import React from 'react';
import { View, Pressable } from 'react-native';
import { Screen, ScrollBody, Spread } from '../components/Screen';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import Photo from '../components/Photo';
import { TopBar, ActionBar, Card, Tag, Btn } from '../components/ui';
import { C, PAD } from '../theme';
import { useApp, useNav } from '../store';
import { TREATMENTS } from '../data/treatments';
import { fmtDate } from '../data/helpers';

export default function SessionReviewScreen({ route }) {
  const params = route.params || {};
  const { store, t, toast } = useApp();
  const nav = useNav();
  const c = store.clients.find((x) => x.id === params.cid);
  const cs = c.cases.find((x) => x.id === params.caseId);
  const s = cs.sessions.find((x) => x.id === params.sessionId);
  const angles = TREATMENTS[cs.treatment].angles;
  const reqd = angles.filter((a) => a.req);
  const got = reqd.filter((a) => s.photos[a.id]?.status === 'captured').length;
  const complete = got >= reqd.length;
  const hasBefore = cs.sessions.some((x) => x.kind === 'before' && x.id !== s.id) || s.kind === 'after';

  return (
    <Screen>
      <TopBar onBack={() => nav.back()} title="Session Review" sub={s.label} border />
      <ScrollBody contentStyle={{ paddingHorizontal: PAD, paddingTop: 14, paddingBottom: 8 }}>
        <Spread style={{ marginHorizontal: 3, marginBottom: 12 }}>
          <Tag variant={s.kind === 'before' ? 'accent' : 'ok'}>{`${s.kind === 'before' ? 'BEFORE' : 'AFTER'} · ${fmtDate(s.date).toUpperCase()}`}</Tag>
          <Txt mono style={{ fontSize: 12.5, fontWeight: '600', color: complete ? C.ok : C.warn }}>{got}/{reqd.length} captured</Txt>
        </Spread>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 11, marginBottom: 14 }}>
          {angles.map((a) => {
            const cap = s.photos[a.id]?.status === 'captured';
            return (
              <Card key={a.id} style={{ width: '47.8%', flexGrow: 1, overflow: 'hidden', padding: 0 }}>
                <Pressable onPress={() => nav.go('camera', { ...params, startIdx: angles.indexOf(a) })}>
                  <Photo
                    angleCode={a.code} eyeHidden={s.photos[a.id]?.eyeHidden ?? true} eyeStyle={t.eyeStyle}
                    uri={s.photos[a.id]?.uri} variant={cap ? 'plain' : 'empty'} style={{ height: 128, borderRadius: 0, borderWidth: 0 }}
                    overlayLabel={!cap ? (
                      <>
                        <Icon name="camera" size={20} color={C.ink3} />
                        <Txt mono style={{ fontSize: 10, color: C.ink3 }}>{a.req ? 'TAP TO CAPTURE' : 'OPTIONAL'}</Txt>
                      </>
                    ) : null}
                  />
                </Pressable>
                <Spread style={{ paddingVertical: 9, paddingHorizontal: 11 }}>
                  <Txt style={{ fontSize: 12.5, fontWeight: '600' }}>{a.name}</Txt>
                  {cap ? <Icon name="check" size={15} color={C.ok} />
                    : (a.req ? <Tag variant="warn" style={{ paddingVertical: 2, paddingHorizontal: 6 }}>!</Tag> : <Tag style={{ paddingVertical: 2, paddingHorizontal: 6 }}>OPT</Tag>)}
                </Spread>
              </Card>
            );
          })}
        </View>
        <View style={{ marginHorizontal: 3, flexDirection: 'row', gap: 7 }}>
          <Icon name="shield" size={14} color={C.ink3} style={{ marginTop: 1 }} />
          <Txt style={{ flex: 1, fontSize: 12.5, color: C.ink3 }}>Originals are stored untouched. Eye-hidden display versions are generated separately for sharing.</Txt>
        </View>
      </ScrollBody>
      <ActionBar>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {hasBefore && <Btn variant="soft" icon="slider" iconSize={18} label="Compare" onPress={() => nav.go('compare', { cid: c.id, caseId: cs.id })} style={{ flex: 1 }} />}
          <Btn variant="primary" icon="check" iconSize={18} label="Save session" onPress={() => {
            toast('Session saved');
            // Land on the Timeline hub with a clean back chain (→ client → home),
            // regardless of whether we came via the capture wizard or the timeline.
            nav.reset([
              { name: 'home' },
              { name: 'clientProfile', params: { cid: c.id } },
              { name: 'timeline', params: { cid: c.id, caseId: cs.id } },
            ]);
          }} style={{ flex: 1.4 }} />
        </View>
      </ActionBar>
    </Screen>
  );
}
