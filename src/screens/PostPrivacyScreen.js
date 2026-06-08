// ============ NATURE — Create Post 4: Privacy (per-photo) ============
import React from 'react';
import { View, ScrollView } from 'react-native';
import Wizard from '../components/Wizard';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import PostPreview from '../components/PostPreview';
import { ActionBar, Card, Btn, Switch, Segmented, Field, SecLabel, Chip } from '../components/ui';
import { C, PAD } from '../theme';
import { useApp, useNav } from '../store';
import { reqAngles, slideCfg, DEFAULT_POST_PRIVACY } from '../data/helpers';

export default function PostPrivacyScreen({ route }) {
  const params = route.params || {};
  const { store, t, toast } = useApp();
  const nav = useNav();
  const c = store.clients.find((x) => x.id === params.cid);
  const cs = c.cases.find((x) => x.id === params.caseId);

  const angleIds = params.cfg?.sel?.length ? params.cfg.sel : [undefined];
  const multi = angleIds.length > 1;
  const [privacy, setPrivacy] = React.useState(() =>
    Object.fromEntries(angleIds.map((a) => [a, { ...DEFAULT_POST_PRIVACY }]))
  );
  const [active, setActive] = React.useState(0);
  const activeAngle = angleIds[Math.min(active, angleIds.length - 1)];
  const pa = privacy[activeAngle] || DEFAULT_POST_PRIVACY;
  const set = (k, v) => setPrivacy((o) => ({ ...o, [activeAngle]: { ...o[activeAngle], [k]: v } }));
  const applyToAll = () => {
    setPrivacy(Object.fromEntries(angleIds.map((a) => [a, { ...pa }])));
    toast('Applied to all photos');
  };
  const cfg = { ...params.cfg, privacy };
  const blocked = !c.consentSocial;

  const angleName = React.useMemo(() => {
    const m = {};
    reqAngles(cs.treatment).forEach((a) => { m[a.id] = a.name; });
    return m;
  }, [cs.treatment]);

  const Row = ({ k, label, sub }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13, paddingHorizontal: PAD, borderTopColor: C.line }}>
      <View style={{ flex: 1 }}>
        <Txt style={{ fontWeight: '600', fontSize: 14.5 }}>{label}</Txt>
        {sub ? <Txt style={{ fontSize: 12, color: C.ink3 }}>{sub}</Txt> : null}
      </View>
      <Switch on={!!pa[k]} onChange={(v) => set(k, v)} />
    </View>
  );

  return (
    <Wizard step={2} total={3} title="Privacy" sub={multi ? 'Set options per photo' : 'Defaults are privacy-safe'}
      footer={<ActionBar><Btn variant="primary" lg block disabled={blocked} icon="shield" iconSize={18} label={blocked ? 'Consent required' : 'Export'} onPress={() => nav.go('postExport', { ...params, cfg })} /></ActionBar>}>
      <View style={{ alignItems: 'center', paddingTop: 2, paddingBottom: 14 }}>
        <PostPreview cfg={slideCfg(cfg, activeAngle)} t={t} c={c} cs={cs} size={180} />
      </View>

      {multi && (
        <View style={{ marginBottom: 14 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 1 }}>
            {angleIds.map((aid, i) => (
              <Chip key={aid || i} accent on={i === active} label={angleName[aid] || `Photo ${i + 1}`} onPress={() => setActive(i)} />
            ))}
          </ScrollView>
        </View>
      )}

      {blocked && (
        <Card pad style={{ borderWidth: 1.5, borderColor: C.warn, backgroundColor: C.warnWash, marginBottom: 14, flexDirection: 'row', gap: 12 }}>
          <Icon name="shield" size={20} color={C.warn} style={{ marginTop: 1 }} />
          <View style={{ flex: 1 }}>
            <Txt style={{ fontWeight: '700', fontSize: 14, color: '#9a6406' }}>Social-media consent is off</Txt>
            <Txt style={{ fontSize: 12.5, color: C.ink3, marginTop: 3, marginBottom: 10 }}>{c.name} has not granted social use. Export is blocked.</Txt>
            <Btn label="Record consent now" onPress={() => { store.setConsent(c.id, 'social', true); toast('Consent recorded'); }} style={{ backgroundColor: '#fff', borderColor: C.warn, alignSelf: 'flex-start' }} color="#9a6406" />
          </View>
        </Card>
      )}

      <Field label="Eyes">
        <Segmented options={[{ v: 'hidden', l: 'Hidden (safe)' }, { v: 'visible', l: 'Visible' }]} value={pa.eyes} onChange={(v) => set('eyes', v)} />
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
      {multi && (
        <Btn variant="soft" icon="check" iconSize={17} label="Apply these to all photos" onPress={applyToAll} style={{ marginTop: 14 }} />
      )}
    </Wizard>
  );
}
