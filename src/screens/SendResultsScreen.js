// ============ NATURE — Send results to the client ============
// Clinical documentation flow: a before/after composite (redaction honored)
// plus the treatment's result text + description, delivered to the client.
// Deep links can't attach media and text together, so the UX is an honest two
// step: 1) send the text via WhatsApp/SMS, 2) share the image (pick the same
// chat in the share sheet). Sending a client their own photos needs no social
// consent — this never goes near the social pipeline.
import React from 'react';
import { View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Screen, ScrollBody } from '../components/Screen';
import Txt from '../components/Txt';
import PostPreview from '../components/PostPreview';
import { TopBar, ActionBar, Card, Chip, Btn, Field, Input, Cap, Tag } from '../components/ui';
import { C, PAD } from '../theme';
import { useApp, useNav } from '../store';
import { TREATMENTS } from '../data/treatments';
import { capturedSessions } from '../data/helpers';
import { captureAsset } from '../data/postCapture';
import { sharePost } from '../data/posts';
import { buildMessage, getTemplate, normalizePhone, openWhatsApp, openSMS } from '../data/messages';

const OFFSCREEN_PT = 360;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function SendResultsScreen({ route }) {
  const params = route.params || {};
  const { store, t, toast } = useApp();
  const nav = useNav();
  const c = store.clients.find((x) => x.id === params.cid);
  const cs = c?.cases.find((x) => x.id === params.caseId);
  const shotRef = React.useRef(null);
  const [busy, setBusy] = React.useState(false);

  const angles = React.useMemo(() => {
    if (!cs) return [];
    const all = TREATMENTS[cs.treatment].angles;
    const paired = all.filter((a) => capturedSessions(cs, a.id).length >= 2);
    return paired.length ? paired : all.filter((a) => capturedSessions(cs, a.id).length >= 1);
  }, [cs]);

  const [aid, setAid] = React.useState(params.angleId || angles[0]?.id);
  const [text, setText] = React.useState('');

  React.useEffect(() => {
    if (!c || !cs) return;
    const body = buildMessage('resultText', { client: c, tid: cs.treatment, getSetting: store.getSetting });
    const override = store.getSetting(`tpl:${cs.treatment}`, null) || {};
    const description = override.description ?? TREATMENTS[cs.treatment].description;
    setText(description ? `${body}\n\n${description}` : body);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!c || !cs) return null;

  const phone = normalizePhone(c.phone);
  // clinical composite: never show the client's name on the asset; honor the
  // client's own eye-redaction preference (their photos, their choice)
  const cfg = {
    format: '1:1', sel: aid ? [aid] : [], template: 'split',
    privacy: {
      eyes: c.eyeDefault === 'visible' ? 'visible' : 'hidden',
      bgRemove: false, name: false, treatment: true, date: true, logo: true, doctor: false, disclaimer: false,
    },
  };

  const sendWa = async () => {
    if (!phone) { toast('No phone number on the client'); return; }
    if (await openWhatsApp(phone.digits, text)) toast('Opening WhatsApp…');
    else toast('WhatsApp is not available');
  };
  const sendSms = async () => {
    if (!phone) { toast('No phone number on the client'); return; }
    if (await openSMS(phone.e164, text)) toast('Opening Messages…');
    else toast('SMS is not available');
  };
  const copy = async () => {
    await Clipboard.setStringAsync(text);
    toast('Text copied');
  };
  const shareImage = async () => {
    if (busy || !aid) return;
    setBusy(true);
    try {
      await wait(350); // let the off-screen composite settle
      const uri = await captureAsset(shotRef.current, '1:1');
      const ok = await sharePost([uri]);
      if (!ok) toast('Sharing unavailable here');
    } catch (e) {
      if (e?.message === 'capture-unavailable') toast('Rendering needs a dev build (not Expo Go)');
      else toast('Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <TopBar onBack={nav.back} title="Send Results" sub={`${c.name} · ${TREATMENTS[cs.treatment].name}`} border />
      <ScrollBody contentStyle={{ paddingHorizontal: PAD, paddingTop: 14, paddingBottom: 8 }}>
        {angles.length === 0 ? (
          <Card pad style={{ alignItems: 'center', paddingVertical: 30 }}>
            <Txt style={{ fontWeight: '700' }}>Nothing to send yet</Txt>
            <Txt style={{ fontSize: 12.5, color: C.ink3, marginTop: 4, textAlign: 'center' }}>Capture before/after photos for this case first.</Txt>
          </Card>
        ) : (
          <>
            <Field label="Angle">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {angles.map((a) => (
                  <Chip key={a.id} accent on={aid === a.id} label={a.name} onPress={() => setAid(a.id)} />
                ))}
              </View>
            </Field>

            <View style={{ alignItems: 'center', marginBottom: 14 }}>
              <PostPreview cfg={cfg} t={t} c={c} cs={cs} size={260} />
              <Cap style={{ marginTop: 8 }}>Redaction and privacy settings are baked into the shared image.</Cap>
            </View>

            <Field label="Message" hint="(edit before sending)">
              <Input value={text} onChangeText={setText} multiline style={{ minHeight: 130, textAlignVertical: 'top', fontSize: 13.5 }} />
            </Field>

            <Card flat pad style={{ backgroundColor: C.accentWash, marginBottom: 14 }}>
              <Txt style={{ fontSize: 12.5, color: C.accentInk }}>
                <Txt style={{ fontWeight: '700', color: C.accentInk }}>Two steps:</Txt> send the text first, then share the image
                to the same chat — messaging apps can't receive both in one link.
              </Txt>
            </Card>

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <Btn variant="primary" icon="send" label="1 · Text via WhatsApp" style={{ flex: 1 }} onPress={sendWa} />
              <Btn variant="soft" icon="message" label="SMS" onPress={sendSms} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Btn variant="default" block icon="image" label={busy ? 'Rendering…' : '2 · Share image'} disabled={busy} style={{ flex: 1 }} onPress={shareImage} />
              <Chip label="Copy text" onPress={copy} />
            </View>
            {!phone && <Tag variant="warn" style={{ marginTop: 12 }}>No phone number — add one to the client to send texts</Tag>}
          </>
        )}
      </ScrollBody>

      {/* off-screen full-size composite for the snapshot */}
      <View style={{ position: 'absolute', left: -100000, top: 0 }} pointerEvents="none">
        <View ref={shotRef} collapsable={false}>
          <PostPreview cfg={cfg} t={t} c={c} cs={cs} size={OFFSCREEN_PT} />
        </View>
      </View>

      <ActionBar>
        <Btn variant="ghost" block label="Done" onPress={nav.back} />
      </ActionBar>
    </Screen>
  );
}
