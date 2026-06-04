// ============ NATURE — New Case Setup ============
import React from 'react';
import { View, Pressable } from 'react-native';
import { Screen, ScrollBody } from '../components/Screen';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import TGlyph from '../components/TGlyph';
import { TopBar, ActionBar, Card, Avatar, Tag, Chip, Segmented, Field, Input, Btn, IconBtn, Sheet } from '../components/ui';
import { C, PAD } from '../theme';
import { useApp, useNav } from '../store';
import { TREATMENTS, BEFORE_LABELS } from '../data/treatments';
import { reqAngles, fmtDateLong, uid, TODAY } from '../data/helpers';

export default function CaseSetupScreen({ route }) {
  const params = route.params || {};
  const { store, toast } = useApp();
  const nav = useNav();
  const T = TREATMENTS[params.tid];
  const [cid, setCid] = React.useState(params.cid || null);
  const c = store.clients.find((x) => x.id === cid);
  const [pract, setPract] = React.useState('Dr. Demir');
  const [label, setLabel] = React.useState('Baseline');
  const [notes, setNotes] = React.useState('');
  const [pickOpen, setPickOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const date = TODAY;

  const results = store.clients.filter(
    (x) => !q || x.name.toLowerCase().includes(q.toLowerCase()) || x.code.toLowerCase().includes(q.toLowerCase()) || x.phone.includes(q)
  );

  const create = () => {
    if (!c) { setPickOpen(true); return; }
    const session = { id: uid(), kind: 'before', label: label === 'Baseline' ? 'Baseline Before' : label, date, photos: {} };
    const cs = { id: uid(), treatment: params.tid, started: date, practitioner: pract, sessions: [session] };
    store.addCase(c.id, cs);
    toast('Case created');
    nav.replace('angleChecklist', { cid: c.id, caseId: cs.id, sessionId: session.id });
  };

  return (
    <Screen>
      <TopBar onBack={nav.back} title="New Case" border />
      <ScrollBody contentStyle={{ paddingHorizontal: PAD, paddingTop: 16, paddingBottom: 8 }}>
        <Card pad style={{ flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 16 }}>
          <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: C.accentWash, alignItems: 'center', justifyContent: 'center' }}>
            <TGlyph tid={params.tid} size={26} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt style={{ fontWeight: '700', fontSize: 16 }}>{T.name}</Txt>
            <Txt style={{ fontSize: 12.5, color: C.ink3 }}>{reqAngles(params.tid).length} required angles</Txt>
          </View>
          <Chip label="Change" onPress={nav.back} />
        </Card>

        <Field label="Client">
          {c ? (
            <Card onPress={() => setPickOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 12, paddingHorizontal: 14 }}>
              <Avatar initials={c.initials} size={42} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt style={{ fontWeight: '700' }}>{c.name}</Txt>
                <Txt mono style={{ fontSize: 12, color: C.ink3, marginTop: 2 }}>{c.code}</Txt>
              </View>
              <Chip label="Change" />
            </Card>
          ) : (
            <Pressable onPress={() => setPickOpen(true)} style={selectBox}>
              <Icon name="user" size={18} color={C.ink3} />
              <Txt style={{ flex: 1, color: C.ink3 }}>Select or create a client</Txt>
              <Icon name="chevR" size={17} color={C.ink3} />
            </Pressable>
          )}
        </Field>

        <Field label="Date">
          <View style={[selectBox, { gap: 10 }]}>
            <Icon name="calendar" size={18} color={C.ink3} />
            <Txt>{fmtDateLong(date)}</Txt>
            <Tag style={{ marginLeft: 'auto' }}>Today</Tag>
          </View>
        </Field>
        <Field label="Practitioner">
          <Segmented options={['Dr. Demir', 'Dr. Aydın']} value={pract} onChange={setPract} />
        </Field>
        <Field label="Session label">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {BEFORE_LABELS.map((l) => <Chip key={l} accent on={label === l} label={l} onPress={() => setLabel(l)} />)}
          </View>
        </Field>
        <Field label="Notes" hint="(optional)">
          <Input value={notes} onChangeText={setNotes} placeholder="Practitioner notes for this session…" multiline style={{ minHeight: 64, textAlignVertical: 'top' }} />
        </Field>
      </ScrollBody>
      <ActionBar>
        <Btn variant="primary" lg block disabled={!c} icon="camera" iconSize={19} onPress={create}
          label={c ? 'Create case & start capture' : 'Select a client to continue'} />
      </ActionBar>

      <Sheet open={pickOpen} onClose={() => setPickOpen(false)} title="Select client">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: C.line2, backgroundColor: C.surface, borderRadius: 13, paddingRight: 12, marginBottom: 12 }}>
          <View style={{ paddingLeft: 14 }}><Icon name="search" size={19} color={C.ink3} /></View>
          <Input autoFocus value={q} onChangeText={setQ} placeholder="Name, client code or phone" style={{ flex: 1, borderWidth: 0, backgroundColor: 'transparent', borderRadius: 0, paddingHorizontal: 0 }} />
          {q ? <IconBtn name="x" size={18} color={C.ink3} bare onPress={() => setQ('')} /> : null}
        </View>
        <Card onPress={() => { setPickOpen(false); nav.go('newClient', { after: 'casesetup', tid: params.tid }); }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 12, borderWidth: 1.5, borderColor: C.accent, backgroundColor: C.accentWash }}>
          <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={20} color="#fff" /></View>
          <View><Txt style={{ fontWeight: '700', color: C.accentInk }}>New Client</Txt><Txt style={{ fontSize: 12.5, color: C.ink3 }}>Create a profile + consent</Txt></View>
        </Card>
        <Card>
          {results.map((x, i) => (
            <Pressable key={x.id} onPress={() => { setCid(x.id); setPickOpen(false); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13, paddingHorizontal: PAD, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
              <Avatar initials={x.initials} size={40} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt style={{ fontWeight: '600' }}>{x.name}</Txt>
                <Txt mono style={{ fontSize: 12, color: C.ink3, marginTop: 2 }}>{x.code} · {x.cases.length} case{x.cases.length > 1 ? 's' : ''}</Txt>
              </View>
              {cid === x.id && <Icon name="check" size={18} color={C.accent} />}
            </Pressable>
          ))}
          {results.length === 0 && <View style={{ padding: 22, alignItems: 'center' }}><Txt style={{ fontSize: 13.5, color: C.ink3 }}>No client matches “{q}”.</Txt></View>}
        </Card>
      </Sheet>
    </Screen>
  );
}

const selectBox = { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: C.line2, backgroundColor: C.surface, borderRadius: 13, paddingVertical: 13, paddingHorizontal: 14 };
