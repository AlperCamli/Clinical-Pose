// ============ NATURE — Client Profile (+ consent detail sheet) ============
import React from 'react';
import { View } from 'react-native';
import { Screen, ScrollBody, Spread } from '../components/Screen';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import TGlyph from '../components/TGlyph';
import { TopBar, Card, Avatar, Tag, Chip, Switch, Btn, IconBtn, SecLabel, ConsentBadges, Sheet } from '../components/ui';
import { C, PAD } from '../theme';
import { useApp, useNav } from '../store';
import { TREATMENTS } from '../data/treatments';
import { fmtDate } from '../data/helpers';

export default function ClientProfileScreen({ route }) {
  const params = route.params || {};
  const { store } = useApp();
  const nav = useNav();
  const c = store.clients.find((x) => x.id === params.cid);
  const [consentOpen, setConsentOpen] = React.useState(false);
  if (!c) return null;

  return (
    <Screen>
      <TopBar
        onBack={nav.back} title="Client" border
        right={<IconBtn name="note" size={18} onPress={() => nav.go('newClient', { cid: c.id })} accessibilityLabel="Edit" />}
      />
      <ScrollBody contentStyle={{ paddingHorizontal: PAD, paddingTop: 16, paddingBottom: 8 }}>
        <Card pad style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <Avatar initials={c.initials} size={56} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt style={{ fontWeight: '800', fontSize: 20, letterSpacing: -0.3 }}>{c.name}</Txt>
              <Txt mono style={{ fontSize: 12.5, color: C.ink3, marginTop: 2 }}>{c.code}</Txt>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.line, alignItems: 'center' }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="phone" size={16} color={C.ink3} />
              <Txt mono style={{ fontSize: 12.5, color: C.ink2 }}>{c.phone || '—'}</Txt>
            </View>
            <Chip icon="shield" label="Consent" onPress={() => setConsentOpen(true)} />
          </View>
          <View style={{ marginTop: 12 }}><ConsentBadges client={c} /></View>
        </Card>

        <Spread style={{ marginHorizontal: 3, marginBottom: 10 }}>
          <SecLabel style={{ margin: 0 }}>Treatment cases</SecLabel>
          <Tag>{String(c.cases.length)}</Tag>
        </Spread>
        <View style={{ gap: 10, marginBottom: 14 }}>
          {c.cases.map((cs) => {
            const T = TREATMENTS[cs.treatment];
            return (
              <Card key={cs.id} onPress={() => nav.go('timeline', { cid: c.id, caseId: cs.id })} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14 }}>
                <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' }}>
                  <TGlyph tid={cs.treatment} size={23} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt style={{ fontWeight: '700' }}>{T.name}</Txt>
                  <Txt style={{ fontSize: 12.5, color: C.ink3, marginTop: 2 }}>Started {fmtDate(cs.started)} · {cs.sessions.length} session{cs.sessions.length > 1 ? 's' : ''}</Txt>
                </View>
                <Icon name="chevR" size={18} color={C.ink3} />
              </Card>
            );
          })}
        </View>
        <Btn variant="soft" lg block icon="plus" iconSize={18} label="New treatment case" onPress={() => nav.go('treatmentPicker', { cid: c.id })} />
      </ScrollBody>

      <Sheet open={consentOpen} onClose={() => setConsentOpen(false)} title="Consent record">
        <Card style={{ marginBottom: 12 }}>
          <View style={consentRow}>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontWeight: '600' }}>Clinical archive</Txt>
              <Txt style={{ fontSize: 12, color: C.ink3 }}>Granted · 21 May 2026</Txt>
            </View>
            <Switch on={c.consentClinical} onChange={(v) => { c.consentClinical = v; store.bump(); }} />
          </View>
          <View style={[consentRow, { borderTopWidth: 1, borderTopColor: C.line }]}>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontWeight: '600' }}>Social media use</Txt>
              <Txt style={{ fontSize: 12, color: C.ink3 }}>{c.consentSocial ? 'Granted' : 'Not granted'}</Txt>
            </View>
            <Switch on={c.consentSocial} onChange={(v) => { c.consentSocial = v; store.bump(); }} />
          </View>
        </Card>
        <Btn variant="primary" block label="Done" onPress={() => setConsentOpen(false)} />
      </Sheet>
    </Screen>
  );
}

const consentRow = { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13, paddingHorizontal: PAD };
