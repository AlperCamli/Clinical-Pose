// ============ NATURE — Case Timeline (vertical variant) ============
import React from 'react';
import { View, Pressable } from 'react-native';
import { Screen, ScrollBody, Spread } from '../components/Screen';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import TGlyph from '../components/TGlyph';
import Photo from '../components/Photo';
import { TopBar, ActionBar, Card, Tag, Btn, IconBtn, SecLabel } from '../components/ui';
import { C, PAD } from '../theme';
import { useApp, useNav } from '../store';
import { TREATMENTS } from '../data/treatments';
import { reqAngles, capCount, fmtDate } from '../data/helpers';

export default function TimelineScreen({ route }) {
  const params = route.params || {};
  const { store, t } = useApp();
  const nav = useNav();
  const c = store.clients.find((x) => x.id === params.cid);
  const cs = c?.cases.find((x) => x.id === params.caseId);
  if (!cs) return null;
  const T = TREATMENTS[cs.treatment];

  return (
    <Screen>
      <TopBar
        onBack={nav.back} title="Timeline" border
        right={<IconBtn name="slider" size={18} onPress={() => nav.go('compare', { cid: c.id, caseId: cs.id })} accessibilityLabel="Compare" />}
      />
      <ScrollBody contentStyle={{ paddingHorizontal: PAD, paddingTop: 16, paddingBottom: 8 }}>
        {/* Header */}
        <Card pad style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 13 }}>
          <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' }}>
            <TGlyph tid={cs.treatment} size={25} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt style={{ fontWeight: '800', fontSize: 17, letterSpacing: -0.3 }}>{T.name}</Txt>
            <Pressable onPress={() => nav.popTo('clientProfile', { cid: c.id })} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <Txt style={{ fontSize: 12.5, color: C.ink3 }}>{c.name} · {c.code}</Txt>
              <Icon name="chevR" size={12} color={C.ink3} />
            </Pressable>
          </View>
          <Tag>{`${cs.sessions.length} sess.`}</Tag>
        </Card>

        <Card onPress={() => nav.go('postHistory', { cid: c.id, caseId: cs.id })}
          style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.accentWash, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="image" size={19} color={C.accentInk} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt style={{ fontWeight: '600', fontSize: 14.5 }}>Social media posts</Txt>
            <Txt style={{ fontSize: 12, color: C.ink3 }}>Shared & ready-to-share content</Txt>
          </View>
          <Tag>{String((cs.posts || []).length)}</Tag>
          <Icon name="chevR" size={17} color={C.ink3} />
        </Card>

        {/* client-facing actions: result documentation + consult-room TV mode */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <Btn variant="soft" icon="send" iconSize={17} label="Send to client" style={{ flex: 1 }}
            onPress={() => nav.go('sendResults', { cid: c.id, caseId: cs.id })} />
          <Btn variant="soft" icon="tv" iconSize={17} label="Present on TV" style={{ flex: 1 }}
            onPress={() => nav.go('presentation', { cid: c.id, caseId: cs.id })} />
        </View>

        <Spread style={{ marginHorizontal: 3, marginBottom: 12 }}>
          <SecLabel style={{ margin: 0 }}>Session history</SecLabel>
          <Txt style={{ fontSize: 12, color: C.ink3 }}>oldest → newest</Txt>
        </Spread>

        {/* vertical timeline */}
        <View style={{ position: 'relative' }}>
          <View style={{ position: 'absolute', left: 9, top: 8, bottom: 8, width: 2, backgroundColor: C.line }} />
          <View style={{ gap: 14 }}>
            {cs.sessions.map((s) => (
              <View key={s.id} style={{ paddingLeft: 30, position: 'relative' }}>
                <View style={{ position: 'absolute', left: 3, top: 16, width: 14, height: 14, borderRadius: 99, backgroundColor: s.kind === 'before' ? C.accent : C.ok, borderWidth: 3, borderColor: C.paper }} />
                <SessionCard s={s} cs={cs} c={c} t={t} nav={nav} />
              </View>
            ))}
          </View>
        </View>
      </ScrollBody>
      <ActionBar>
        <Btn variant="primary" lg block icon="plus" iconSize={19} label="Add follow-up session" onPress={() => nav.go('sessionSetup', { cid: c.id, caseId: cs.id })} />
      </ActionBar>
    </Screen>
  );
}

function SessionCard({ s, cs, c, t, nav }) {
  const { got, total } = capCount(s, cs.treatment);
  const missing = got < total;
  return (
    <Card style={{ overflow: 'hidden' }}>
      <Pressable onPress={() => nav.go('sessionReview', { cid: c.id, caseId: cs.id, sessionId: s.id })} style={{ paddingTop: 14, paddingHorizontal: PAD, paddingBottom: 12 }}>
        <Spread>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <Tag variant={s.kind === 'before' ? 'accent' : 'ok'}>{s.kind === 'before' ? 'BEFORE' : 'AFTER'}</Tag>
            <Txt style={{ fontWeight: '700', fontSize: 15.5 }}>{s.label}</Txt>
          </View>
          <Txt mono style={{ fontSize: 12, color: C.ink3 }}>{fmtDate(s.date)}</Txt>
        </Spread>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
          {reqAngles(cs.treatment).slice(0, 5).map((a) => {
            const p = s.photos[a.id];
            return (
              <Photo key={a.id} eyeStyle={t.eyeStyle} eyeHidden={p?.eyeHidden ?? true} uri={p?.uri}
                eyeBoxes={p?.eyeBoxes} imgW={p?.imgW} imgH={p?.imgH}
                fileMissing={p?.fileMissing}
                variant={(p?.status === 'captured' || p?.fileMissing) ? 'plain' : 'empty'} style={{ flex: 1, height: 50 }} />
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 }}>
          <Icon name={missing ? 'bolt' : 'check'} size={12} color={missing ? C.warn : C.ok} />
          <Txt mono style={{ fontSize: 11.5, color: missing ? C.warn : C.ok }}>{got}/{total} angles{missing ? ' · missing' : ''}</Txt>
        </View>
      </Pressable>
      <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.line }}>
        <Btn variant="ghost" icon="slider" iconSize={17} label="Compare" onPress={() => nav.go('compare', { cid: c.id, caseId: cs.id })} style={{ flex: 1, borderRadius: 0, paddingVertical: 12 }} />
        <View style={{ width: 1, backgroundColor: C.line }} />
        <Btn variant="ghost" icon="image" iconSize={17} label="Create post" onPress={() => nav.go('postSelect', { cid: c.id, caseId: cs.id })} style={{ flex: 1, borderRadius: 0, paddingVertical: 12 }} />
      </View>
    </Card>
  );
}
