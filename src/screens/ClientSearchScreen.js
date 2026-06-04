// ============ NATURE — Client Search ============
import React from 'react';
import { View, Pressable } from 'react-native';
import { Screen, ScrollBody } from '../components/Screen';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import { TopBar, Card, Avatar, SecLabel, IconBtn, Btn, Input } from '../components/ui';
import { C, PAD } from '../theme';
import { useApp, useNav } from '../store';

export default function ClientSearchScreen({ route }) {
  const params = route.params || {};
  const { store } = useApp();
  const nav = useNav();
  const [q, setQ] = React.useState('');
  const mode = params.mode || 'find';

  const results = store.clients.filter(
    (c) => !q ||
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      c.code.toLowerCase().includes(q.toLowerCase()) ||
      c.phone.includes(q)
  );

  const pick = (c) => {
    if (mode === 'newcase') nav.go('treatmentPicker', { cid: c.id });
    else nav.go('clientProfile', { cid: c.id });
  };

  return (
    <Screen>
      <TopBar onBack={nav.back} title={mode === 'newcase' ? 'Select Client' : 'Find Client'} border />
      <View style={{ paddingHorizontal: PAD, paddingTop: 14, paddingBottom: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: C.line2, backgroundColor: C.surface, borderRadius: 13, paddingRight: 12 }}>
          <View style={{ paddingLeft: 14 }}><Icon name="search" size={19} color={C.ink3} /></View>
          <Input
            autoFocus value={q} onChangeText={setQ} placeholder="Name, client code or phone"
            style={{ flex: 1, borderWidth: 0, backgroundColor: 'transparent', borderRadius: 0, paddingHorizontal: 0 }}
          />
          {q ? <IconBtn name="x" size={18} color={C.ink3} bare onPress={() => setQ('')} /> : null}
        </View>
      </View>

      <ScrollBody contentStyle={{ paddingHorizontal: PAD, paddingTop: 6, paddingBottom: 12 }}>
        {mode === 'newcase' && (
          <Card
            onPress={() => nav.go('newClient', { after: 'newcase' })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14, marginBottom: 12, borderWidth: 1.5, borderColor: C.accent, backgroundColor: C.accentWash }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={22} color="#fff" /></View>
            <View>
              <Txt style={{ fontWeight: '700', color: C.accentInk }}>New Client</Txt>
              <Txt style={{ fontSize: 12.5, color: C.ink3 }}>Create a profile + consent</Txt>
            </View>
          </Card>
        )}

        <SecLabel>{`${results.length} ${results.length === 1 ? 'match' : 'matches'}`}</SecLabel>
        <Card>
          {results.map((c, i) => (
            <Pressable
              key={c.id}
              onPress={() => pick(c)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13, paddingHorizontal: PAD, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}
            >
              <Avatar initials={c.initials} size={42} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt style={{ fontWeight: '600' }}>{c.name}</Txt>
                <Txt mono style={{ fontSize: 12, color: C.ink3, marginTop: 2 }}>{c.code} · {c.cases.length} case{c.cases.length > 1 ? 's' : ''}</Txt>
              </View>
              <Icon name="chevR" size={18} color={C.ink3} />
            </Pressable>
          ))}
          {results.length === 0 && (
            <View style={{ padding: 26, alignItems: 'center' }}>
              <Txt style={{ fontSize: 13.5, color: C.ink3, marginBottom: 12, textAlign: 'center' }}>No client matches “{q}”.</Txt>
              <Btn variant="soft" icon="plus" iconSize={17} label="Create new client" onPress={() => nav.go('newClient', { after: mode === 'newcase' ? 'newcase' : 'profile' })} />
            </View>
          )}
        </Card>
      </ScrollBody>
    </Screen>
  );
}
