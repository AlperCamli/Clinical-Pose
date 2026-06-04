// ============ NATURE — Create Post 4: Privacy ============
import React from 'react';
import { View } from 'react-native';
import Wizard from '../components/Wizard';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import PostPreview from '../components/PostPreview';
import { ActionBar, Card, Btn, Switch, Segmented, Field, SecLabel } from '../components/ui';
import { C, PAD } from '../theme';
import { useApp, useNav } from '../store';

export default function PostPrivacyScreen({ route }) {
  const params = route.params || {};
  const { store, t, toast } = useApp();
  const nav = useNav();
  const c = store.clients.find((x) => x.id === params.cid);
  const cs = c.cases.find((x) => x.id === params.caseId);
  const [p, setP] = React.useState({ eyes: 'hidden', name: false, treatment: true, date: true, logo: true, doctor: false, disclaimer: true });
  const cfg = { ...params.cfg, privacy: p };
  const set = (k, v) => setP((o) => ({ ...o, [k]: v }));
  const blocked = !c.consentSocial;

  const Row = ({ k, label, sub }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13, paddingHorizontal: PAD, borderTopColor: C.line }}>
      <View style={{ flex: 1 }}>
        <Txt style={{ fontWeight: '600', fontSize: 14.5 }}>{label}</Txt>
        {sub ? <Txt style={{ fontSize: 12, color: C.ink3 }}>{sub}</Txt> : null}
      </View>
      <Switch on={!!p[k]} onChange={(v) => set(k, v)} />
    </View>
  );

  return (
    <Wizard step={3} title="Privacy" sub="Defaults are privacy-safe"
      footer={<ActionBar><Btn variant="primary" lg block disabled={blocked} icon="shield" iconSize={18} label={blocked ? 'Consent required' : 'Export'} onPress={() => nav.go('postExport', { ...params, cfg })} /></ActionBar>}>
      <View style={{ alignItems: 'center', paddingTop: 2, paddingBottom: 16 }}>
        <PostPreview cfg={cfg} t={t} c={c} cs={cs} size={180} />
      </View>

      {blocked && (
        <Card pad style={{ borderWidth: 1.5, borderColor: C.warn, backgroundColor: C.warnWash, marginBottom: 14, flexDirection: 'row', gap: 12 }}>
          <Icon name="shield" size={20} color={C.warn} style={{ marginTop: 1 }} />
          <View style={{ flex: 1 }}>
            <Txt style={{ fontWeight: '700', fontSize: 14, color: '#9a6406' }}>Social-media consent is off</Txt>
            <Txt style={{ fontSize: 12.5, color: C.ink3, marginTop: 3, marginBottom: 10 }}>{c.name} has not granted social use. Export is blocked.</Txt>
            <Btn label="Record consent now" onPress={() => { c.consentSocial = true; store.bump(); toast('Consent recorded'); }} style={{ backgroundColor: '#fff', borderColor: C.warn, alignSelf: 'flex-start' }} color="#9a6406" />
          </View>
        </Card>
      )}

      <Field label="Eyes">
        <Segmented options={[{ v: 'hidden', l: 'Hidden (safe)' }, { v: 'visible', l: 'Visible' }]} value={p.eyes} onChange={(v) => set('eyes', v)} />
      </Field>
      <SecLabel>Show on asset</SecLabel>
      <Card>
        <Row k="name" label="Client name" sub="Off by default" />
        <View style={{ borderTopWidth: 1, borderTopColor: C.line }}><Row k="treatment" label="Treatment name" /></View>
        <View style={{ borderTopWidth: 1, borderTopColor: C.line }}><Row k="date" label="Date range" /></View>
        <View style={{ borderTopWidth: 1, borderTopColor: C.line }}><Row k="logo" label="Clinic logo" /></View>
        <View style={{ borderTopWidth: 1, borderTopColor: C.line }}><Row k="doctor" label="Doctor name" /></View>
        <View style={{ borderTopWidth: 1, borderTopColor: C.line }}><Row k="disclaimer" label="Results disclaimer" /></View>
      </Card>
    </Wizard>
  );
}
