// ============ NATURE — Angle Checklist ============
import React from 'react';
import { View, Pressable } from 'react-native';
import { Screen, ScrollBody, Spread } from '../components/Screen';
import Txt from '../components/Txt';
import Photo from '../components/Photo';
import { TopBar, ActionBar, Card, Tag, Btn, StatusTag, SecLabel } from '../components/ui';
import { C, PAD } from '../theme';
import { useApp, useNav } from '../store';
import { TREATMENTS } from '../data/treatments';
import { photoCaptured } from '../data/helpers';

export default function AngleChecklistScreen({ route }) {
  const params = route.params || {};
  const { store, t } = useApp();
  const nav = useNav();
  const c = store.clients.find((x) => x.id === params.cid);
  const cs = c?.cases.find((x) => x.id === params.caseId);
  const s = cs?.sessions.find((x) => x.id === params.sessionId);
  if (!s) return null;

  const angles = TREATMENTS[cs.treatment].angles;
  const reqd = angles.filter((a) => a.req);
  const got = reqd.filter((a) => photoCaptured(s.photos[a.id])).length;
  const isAfter = s.kind === 'after';
  const firstMissing = angles.findIndex((a) => a.req && !photoCaptured(s.photos[a.id]));

  const statusOf = (a) => {
    if (photoCaptured(s.photos[a.id])) return 'captured';
    if (!a.req) return 'optional';
    return 'missing';
  };

  return (
    <Screen>
      <TopBar onBack={nav.back} title={s.label} sub={`${TREATMENTS[cs.treatment].name} · ${c.name}`} border />
      <View style={{ paddingHorizontal: PAD, paddingTop: 12, paddingBottom: 4 }}>
        <Card pad style={{ paddingVertical: 14 }}>
          <Spread style={{ marginBottom: 9 }}>
            <Tag variant={isAfter ? 'ok' : 'accent'}>{isAfter ? 'AFTER · OVERLAY' : 'BEFORE · GENERIC GUIDE'}</Tag>
            <Txt mono style={{ fontSize: 12.5, fontWeight: '600', color: got < reqd.length ? C.warn : C.ok }}>{got}/{reqd.length}</Txt>
          </Spread>
          <View style={{ height: 7, borderRadius: 99, backgroundColor: C.surface3, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${(got / reqd.length) * 100}%`, backgroundColor: C.accent, borderRadius: 99 }} />
          </View>
        </Card>
      </View>

      <ScrollBody contentStyle={{ paddingHorizontal: PAD, paddingTop: 8, paddingBottom: 8 }}>
        <SecLabel>Required angles</SecLabel>
        <Card style={{ marginBottom: 14 }}>
          {angles.map((a, i) => {
            const st = statusOf(a);
            return (
              <Pressable key={a.id} onPress={() => nav.go('camera', { ...params, startIdx: i })}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13, paddingHorizontal: PAD, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
                <Photo eyeStyle={t.eyeStyle} eyeHidden={s.photos[a.id]?.eyeHidden ?? true} uri={s.photos[a.id]?.uri}
                  eyeBoxes={s.photos[a.id]?.eyeBoxes} imgW={s.photos[a.id]?.imgW} imgH={s.photos[a.id]?.imgH}
                  fileMissing={s.photos[a.id]?.fileMissing}
                  variant={(st === 'captured' || s.photos[a.id]?.fileMissing) ? 'plain' : 'empty'} style={{ width: 46, height: 46 }} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt style={{ fontWeight: '600', fontSize: 14.5 }}>{a.name}</Txt>
                  <Txt mono style={{ fontSize: 11, color: C.ink3, marginTop: 2 }}>{a.code}</Txt>
                </View>
                <StatusTag status={st} />
              </Pressable>
            );
          })}
        </Card>
        <Btn variant="soft" block icon="plus" iconSize={17} label="Add extra photo"
          onPress={() => nav.go('camera', { ...params, startIdx: Math.max(0, firstMissing), extra: true })} />
      </ScrollBody>
      <ActionBar>
        {got < reqd.length ? (
          <Btn variant="primary" lg block icon="camera" iconSize={19} label={got ? 'Continue capture' : 'Start capture'}
            onPress={() => nav.go('camera', { ...params, startIdx: Math.max(0, firstMissing) })} />
        ) : (
          <Btn variant="primary" lg block icon="check" iconSize={19} label="Review session"
            onPress={() => nav.replace('sessionReview', params)} />
        )}
      </ActionBar>
    </Screen>
  );
}
