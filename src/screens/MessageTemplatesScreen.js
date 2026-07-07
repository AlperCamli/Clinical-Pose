// ============ NATURE — per-treatment message templates ============
// Edits the client-facing texts (Turkish defaults from treatments.js). Saved
// overrides live in settings under 'tpl:<tid>'; reset simply clears the
// override so future default improvements flow through.
import React from 'react';
import { View } from 'react-native';
import { Screen, ScrollBody } from '../components/Screen';
import Txt from '../components/Txt';
import { TopBar, ActionBar, Card, Chip, Field, Input, Btn, Cap } from '../components/ui';
import { C, PAD } from '../theme';
import { useApp, useNav } from '../store';
import { TREATMENTS, TREATMENT_LIST, MSG_FIELDS } from '../data/treatments';

const TOKENS = ['{client}', '{clinic}', '{doctor}', '{treatment}', '{date}', '{time}'];

export default function MessageTemplatesScreen() {
  const { store, toast } = useApp();
  const nav = useNav();
  const [tid, setTid] = React.useState(TREATMENT_LIST[0]);

  const load = React.useCallback((id) => {
    const override = store.getSetting(`tpl:${id}`, null) || {};
    const out = {};
    for (const [f] of MSG_FIELDS) out[f] = override[f] ?? TREATMENTS[id].msg[f];
    out.description = override.description ?? TREATMENTS[id].description;
    return out;
  }, [store]);

  const [vals, setVals] = React.useState(() => load(tid));
  const pick = (id) => { setTid(id); setVals(load(id)); };

  const save = () => {
    store.setSetting(`tpl:${tid}`, vals);
    toast('Templates saved');
  };
  const reset = () => {
    store.setSetting(`tpl:${tid}`, null);
    setVals(load(tid));
    toast('Reset to defaults');
  };

  return (
    <Screen>
      <TopBar onBack={nav.back} title="Message Templates" sub="Client-facing texts per treatment" border />
      <ScrollBody contentStyle={{ paddingHorizontal: PAD, paddingTop: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {TREATMENT_LIST.map((id) => (
            <Chip key={id} accent on={tid === id} label={TREATMENTS[id].short} onPress={() => pick(id)} />
          ))}
        </View>

        <Card flat pad style={{ backgroundColor: C.accentWash, marginBottom: 16 }}>
          <Txt style={{ fontSize: 12.5, color: C.accentInk }}>
            Placeholders fill in automatically when sending:{' '}
            <Txt mono style={{ fontSize: 12, color: C.accentInk }}>{TOKENS.join('  ')}</Txt>
          </Txt>
        </Card>

        {MSG_FIELDS.map(([f, label]) => (
          <Field key={f} label={label}>
            <Input
              value={vals[f]}
              onChangeText={(v) => setVals((o) => ({ ...o, [f]: v }))}
              multiline
              style={{ minHeight: 84, textAlignVertical: 'top', fontSize: 13.5 }}
            />
          </Field>
        ))}
        <Field label="Treatment description" hint="(appended to result messages)">
          <Input
            value={vals.description}
            onChangeText={(v) => setVals((o) => ({ ...o, description: v }))}
            multiline
            style={{ minHeight: 70, textAlignVertical: 'top', fontSize: 13.5 }}
          />
        </Field>
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <Chip label="Reset this treatment to defaults" onPress={reset} />
        </View>
        <Cap style={{ textAlign: 'center', marginBottom: 6 }}>Defaults are in Turkish for the Turkey launch.</Cap>
      </ScrollBody>
      <ActionBar>
        <Btn variant="primary" lg block icon="check" label={`Save ${TREATMENTS[tid].short} templates`} onPress={save} />
      </ActionBar>
    </Screen>
  );
}
