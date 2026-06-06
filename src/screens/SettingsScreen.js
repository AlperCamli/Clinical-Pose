// ============ NATURE — Settings ============
import React from 'react';
import { View, Pressable } from 'react-native';
import { Screen, ScrollBody } from '../components/Screen';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import { TopBar, Card, Switch, Segmented, SecLabel } from '../components/ui';
import { C, PAD } from '../theme';
import { useApp, useNav } from '../store';
import { REDACTION_OPTIONS } from '../data/redactionStyles';

const row = { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13, paddingHorizontal: PAD };

export default function SettingsScreen() {
  const { t, setTweak } = useApp();
  const nav = useNav();
  return (
    <Screen>
      <TopBar onBack={nav.back} title="Settings" border />
      <ScrollBody contentStyle={{ paddingHorizontal: PAD, paddingTop: 14, paddingBottom: 20 }}>
        <SecLabel>Clinic</SecLabel>
        <Card style={{ marginBottom: 16 }}>
          <View style={row}>
            <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}><Icon name="camera" size={20} color="#fff" /></View>
            <View style={{ flex: 1 }}><Txt style={{ fontWeight: '600' }}>Nature Aesthetic Clinic</Txt><Txt style={{ fontSize: 12, color: C.ink3 }}>Logo shown on exports</Txt></View>
            <Icon name="chevR" size={17} color={C.ink3} />
          </View>
          <View style={[row, { borderTopWidth: 1, borderTopColor: C.line }]}>
            <View style={{ flex: 1 }}><Txt style={{ fontWeight: '600' }}>Practitioners</Txt><Txt style={{ fontSize: 12, color: C.ink3 }}>Dr. Demir, Dr. Aydın</Txt></View>
            <Icon name="chevR" size={17} color={C.ink3} />
          </View>
        </Card>

        <SecLabel>Capture defaults</SecLabel>
        <Card style={{ marginBottom: 16 }}>
          <View style={{ paddingHorizontal: PAD, paddingTop: 13, paddingBottom: 13 }}>
            <View style={{ marginBottom: 11 }}><Txt style={{ fontWeight: '600' }}>Default eye-hide style</Txt><Txt style={{ fontSize: 12, color: C.ink3 }}>Applied to display versions</Txt></View>
            <Segmented options={REDACTION_OPTIONS} value={t.eyeStyle} onChange={(v) => setTweak('eyeStyle', v)} />
          </View>
          <View style={[row, { borderTopWidth: 1, borderTopColor: C.line }]}>
            <View style={{ flex: 1 }}><Txt style={{ fontWeight: '600' }}>Eyes hidden by default</Txt><Txt style={{ fontSize: 12, color: C.ink3 }}>Privacy-safe baseline</Txt></View>
            <Switch on onChange={() => {}} />
          </View>
        </Card>

        <SecLabel>Sync</SecLabel>
        <Card>
          <Pressable onPress={() => nav.go('sync')} style={row}>
            <View style={{ flex: 1 }}><Txt style={{ fontWeight: '600' }}>Offline & sync</Txt><Txt style={{ fontSize: 12, color: C.ink3 }}>2 sessions pending upload</Txt></View>
            <Icon name="chevR" size={17} color={C.ink3} />
          </Pressable>
        </Card>
        <Txt style={{ textAlign: 'center', marginTop: 24, fontSize: 12.5, color: C.ink3 }}>Nature · MVP preview · v0.9</Txt>
      </ScrollBody>
    </Screen>
  );
}
