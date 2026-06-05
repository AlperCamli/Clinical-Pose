// ============ NATURE — New / Edit Client ============
import React from 'react';
import { View } from 'react-native';
import { Screen, ScrollBody } from '../components/Screen';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import { TopBar, ActionBar, Card, Switch, Segmented, Field, Input, Btn, SecLabel } from '../components/ui';
import { C, PAD } from '../theme';
import { useApp, useNav } from '../store';
import { uid } from '../data/helpers';

export default function NewClientScreen({ route }) {
  const params = route.params || {};
  const { store, toast } = useApp();
  const nav = useNav();
  const editing = params.cid ? store.clients.find((c) => c.id === params.cid) : null;

  const [name, setName] = React.useState(editing?.name || '');
  const [phone, setPhone] = React.useState(editing?.phone || '');
  const [clin, setClin] = React.useState(editing?.consentClinical ?? true);
  const [soc, setSoc] = React.useState(editing?.consentSocial ?? false);
  const [eye, setEye] = React.useState(editing?.eyeDefault || 'hidden');
  const [notes, setNotes] = React.useState('');
  const code = React.useRef(editing?.code || ('NAT-' + String(140 + store.clients.length + Math.floor(Math.random() * 40)).padStart(4, '0'))).current;

  const save = () => {
    if (editing) {
      store.updateClient(editing.id, { name, phone, consentClinical: clin, consentSocial: soc, eyeDefault: eye });
      toast('Client updated'); nav.back(); return;
    }
    const c = {
      id: uid(), name: name || 'New Client', code, phone, consentClinical: clin, consentSocial: soc,
      eyeDefault: eye, initials: (name || 'NC').split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase(), cases: [],
    };
    store.addClient(c);
    toast('Client created');
    if (params.after === 'newcase') nav.replace('treatmentPicker', { cid: c.id });
    else if (params.after === 'casesetup') nav.replace('caseSetup', { cid: c.id, tid: params.tid });
    else nav.replace('clientProfile', { cid: c.id });
  };

  return (
    <Screen>
      <TopBar onBack={nav.back} title={editing ? 'Edit Client' : 'New Client'} border />
      <ScrollBody contentStyle={{ paddingHorizontal: PAD, paddingTop: 16, paddingBottom: 8 }}>
        <Card pad style={{ marginBottom: 16 }}>
          <Field label="Client name or code">
            <Input value={name} onChangeText={setName} placeholder="e.g. Ayşe K. — or a code only" autoFocus />
          </Field>
          <Field label="Phone" hint="(optional)" style={{ marginBottom: 0 }}>
            <Input value={phone} onChangeText={setPhone} placeholder="+90 5•• ••• •• ••" keyboardType="phone-pad" />
          </Field>
          <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="user" size={13} color={C.ink3} />
            <Txt style={{ fontSize: 12.5, color: C.ink3 }}>Client ID <Txt mono style={{ color: C.ink2, fontSize: 12.5 }}>{code}</Txt> assigned automatically</Txt>
          </View>
        </Card>

        <SecLabel>Consent — kept separate</SecLabel>
        <Card style={{ marginBottom: 8 }}>
          <View style={row}>
            <View style={[iconBox, { backgroundColor: C.okWash }]}><Icon name="shield" size={20} color={C.ok} /></View>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontWeight: '600', fontSize: 14.5 }}>Clinical archive</Txt>
              <Txt style={{ fontSize: 12, color: C.ink3 }}>Store photos in the medical record</Txt>
            </View>
            <Switch on={clin} onChange={setClin} />
          </View>
          <View style={[row, { borderTopWidth: 1, borderTopColor: C.line }]}>
            <View style={[iconBox, { backgroundColor: C.accentWash }]}><Icon name="share" size={19} color={C.accentInk} /></View>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontWeight: '600', fontSize: 14.5 }}>Social media use</Txt>
              <Txt style={{ fontSize: 12, color: C.ink3 }}>Allow exporting before/after posts</Txt>
            </View>
            <Switch on={soc} onChange={setSoc} />
          </View>
        </Card>
        <View style={{ marginHorizontal: 3, marginBottom: 18, flexDirection: 'row', gap: 7 }}>
          <Icon name="shield" size={14} color={C.ink3} style={{ marginTop: 1 }} />
          <Txt style={{ flex: 1, fontSize: 12.5, color: C.ink3 }}>Social consent is never implied by clinical consent. Export is blocked until it is granted.</Txt>
        </View>

        <Field label="Eye visibility — default">
          <Segmented options={[{ v: 'hidden', l: 'Hidden' }, { v: 'visible', l: 'Visible' }]} value={eye} onChange={setEye} />
        </Field>
        <Field label="Notes" hint="(optional)">
          <Input value={notes} onChangeText={setNotes} placeholder="Allergies, preferences, history…" multiline numberOfLines={2} style={{ minHeight: 64, textAlignVertical: 'top' }} />
        </Field>
      </ScrollBody>
      <ActionBar>
        <Btn variant="primary" lg block disabled={!name} onPress={save}
          label={editing ? 'Save changes' : (params.after === 'newcase' ? 'Save & choose treatment' : 'Save client')} />
      </ActionBar>
    </Screen>
  );
}

const row = { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13, paddingHorizontal: PAD };
const iconBox = { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' };
