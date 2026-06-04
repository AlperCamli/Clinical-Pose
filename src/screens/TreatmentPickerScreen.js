// ============ NATURE — Treatment Type Picker ============
import React from 'react';
import { View, Pressable } from 'react-native';
import { Screen, ScrollBody } from '../components/Screen';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import TGlyph from '../components/TGlyph';
import { TopBar, Card } from '../components/ui';
import { C, PAD } from '../theme';
import { useApp, useNav } from '../store';
import { TREATMENTS, TREATMENT_LIST } from '../data/treatments';
import { reqAngles } from '../data/helpers';

export default function TreatmentPickerScreen({ route }) {
  const params = route.params || {};
  const { store } = useApp();
  const nav = useNav();
  const c = store.clients.find((x) => x.id === params.cid);

  return (
    <Screen>
      <TopBar onBack={nav.back} title="Treatment Type" sub={c ? `for ${c.name}` : ''} border />
      <ScrollBody contentStyle={{ paddingHorizontal: PAD, paddingTop: 14, paddingBottom: 8 }}>
        <View style={{ marginHorizontal: 3, marginBottom: 14, flexDirection: 'row', gap: 7 }}>
          <Icon name="bolt" size={15} color={C.accent} style={{ marginTop: 1 }} />
          <Txt style={{ flex: 1, fontSize: 12.5, color: C.ink3 }}>Selecting a type auto-loads its required angles, overlays and post template — no manual setup.</Txt>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 11 }}>
          {TREATMENT_LIST.map((tid) => {
            const T = TREATMENTS[tid];
            const req = reqAngles(tid).length;
            return (
              <Card
                key={tid}
                pad
                onPress={() => nav.go('caseSetup', { cid: params.cid, tid })}
                style={{ width: '47.8%', flexGrow: 1, minHeight: 118, justifyContent: 'space-between' }}
              >
                <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: C.accentWash, alignItems: 'center', justifyContent: 'center' }}>
                  <TGlyph tid={tid} size={24} />
                </View>
                <View>
                  <Txt style={{ fontWeight: '700', fontSize: 15 }}>{T.name}</Txt>
                  <Txt mono style={{ fontSize: 11, color: C.ink3, marginTop: 3 }}>{tid === 'custom' ? 'DEFINE ANGLES' : `${req} REQUIRED ANGLE${req > 1 ? 'S' : ''}`}</Txt>
                </View>
              </Card>
            );
          })}
        </View>
      </ScrollBody>
    </Screen>
  );
}
