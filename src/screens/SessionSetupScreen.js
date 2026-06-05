// ============ NATURE — Session Setup (follow-up / after) ============
import React from 'react';
import { View, Pressable } from 'react-native';
import { Screen, ScrollBody } from '../components/Screen';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import { TopBar, ActionBar, Card, Tag, Chip, Field, Btn } from '../components/ui';
import { C, PAD } from '../theme';
import { useApp, useNav } from '../store';
import { TREATMENTS, AFTER_LABELS } from '../data/treatments';
import { fmtDateLong, uid, TODAY } from '../data/helpers';

const REF_OPTIONS = [
  ['baseline', 'Baseline before', 'Align to the very first photos'],
  ['previous', 'Previous session', 'Align to the most recent set'],
  ['custom', 'Custom photo', 'Pick any prior angle manually'],
];

export default function SessionSetupScreen({ route }) {
  const params = route.params || {};
  const { store } = useApp();
  const nav = useNav();
  const c = store.clients.find((x) => x.id === params.cid);
  const cs = c?.cases.find((x) => x.id === params.caseId);
  const [label, setLabel] = React.useState('After 2 weeks');
  const [ref, setRef] = React.useState('baseline');
  const isAfter = !/before/i.test(label);

  const start = () => {
    const session = { id: uid(), kind: isAfter ? 'after' : 'before', label, date: TODAY, photos: {}, refSource: ref };
    store.addSession(c.id, cs.id, session);
    nav.replace('angleChecklist', { cid: c.id, caseId: cs.id, sessionId: session.id });
  };

  return (
    <Screen>
      <TopBar onBack={nav.back} title="New Session" sub={TREATMENTS[cs.treatment].name} border />
      <ScrollBody contentStyle={{ paddingHorizontal: PAD, paddingTop: 16, paddingBottom: 8 }}>
        <Field label="Session type">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {AFTER_LABELS.map((l) => <Chip key={l} accent on={label === l} label={l} onPress={() => setLabel(l)} />)}
          </View>
        </Field>
        <Field label="Date">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: C.line2, backgroundColor: C.surface, borderRadius: 13, paddingVertical: 13, paddingHorizontal: 14 }}>
            <Icon name="calendar" size={18} color={C.ink3} />
            <Txt>{fmtDateLong(TODAY)}</Txt>
            <Tag style={{ marginLeft: 'auto' }}>Today</Tag>
          </View>
        </Field>

        {isAfter && (
          <Field label="Reference overlay source">
            <Card style={{ padding: 4 }}>
              {REF_OPTIONS.map(([v, title, sub], i) => (
                <Pressable key={v} onPress={() => setRef(v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13, paddingHorizontal: PAD, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
                  <View style={{ flex: 1 }}>
                    <Txt style={{ fontWeight: '600', fontSize: 14.5 }}>{title}</Txt>
                    <Txt style={{ fontSize: 12, color: C.ink3 }}>{sub}</Txt>
                  </View>
                  <View style={{ width: 22, height: 22, borderRadius: 99, borderWidth: 2, borderColor: ref === v ? C.accent : C.line2, alignItems: 'center', justifyContent: 'center' }}>
                    {ref === v && <View style={{ width: 11, height: 11, borderRadius: 99, backgroundColor: C.accent }} />}
                  </View>
                </Pressable>
              ))}
            </Card>
            <View style={{ marginTop: 9, flexDirection: 'row', gap: 7 }}>
              <Icon name="layers" size={14} color={C.accent} style={{ marginTop: 1 }} />
              <Txt style={{ flex: 1, fontSize: 12.5, color: C.ink3 }}>The chosen photo loads as a ghost overlay in the camera so you can match the angle exactly.</Txt>
            </View>
          </Field>
        )}
      </ScrollBody>
      <ActionBar>
        <Btn variant="primary" lg block icon="camera" iconSize={19} label="Start capture" onPress={start} />
      </ActionBar>
    </Screen>
  );
}
