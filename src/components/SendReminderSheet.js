// ============ NATURE — send-reminder sheet ============
// Composes a client message from the treatment's template (editable before
// sending) and hands it to WhatsApp or SMS via deep link — the doctor's own
// composer opens, nothing is sent automatically. `kind` picks the template
// field ('reminder' default; 'preCare'/'afterCare' reuse the same sheet).
import React from 'react';
import { View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Txt from './Txt';
import { Sheet, Input, Btn, Chip, Cap } from './ui';
import { C } from '../theme';
import { useApp, useNav } from '../store';
import { buildMessage, normalizePhone, openWhatsApp, openSMS } from '../data/messages';

export default function SendReminderSheet({ open, onClose, appt, client, kind = 'reminder' }) {
  const { store, toast } = useApp();
  const nav = useNav();
  const [text, setText] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    setText(buildMessage(kind, {
      client, tid: appt?.treatment, startAt: appt?.startAt,
      practitioner: appt?.practitioner, getSetting: store.getSetting,
    }));
  }, [open, kind, appt, client, store]);

  const phone = normalizePhone(client?.phone);

  const sent = () => {
    if (appt) store.markReminderSent(appt.id);
    onClose();
  };

  const sendWa = async () => {
    if (await openWhatsApp(phone.digits, text)) { toast('Opening WhatsApp…'); sent(); }
    else toast('WhatsApp is not available');
  };
  const sendSms = async () => {
    if (await openSMS(phone.e164, text)) { toast('Opening Messages…'); sent(); }
    else toast('SMS is not available');
  };
  const copy = async () => {
    await Clipboard.setStringAsync(text);
    toast('Message copied');
  };

  return (
    <Sheet open={open} onClose={onClose} title={`Message ${client?.name || ''}`}>
      {!phone ? (
        <View style={{ alignItems: 'center', paddingVertical: 14 }}>
          <Txt style={{ fontWeight: '700', marginBottom: 4 }}>No phone number</Txt>
          <Txt style={{ fontSize: 13, color: C.ink3, textAlign: 'center', marginBottom: 14 }}>
            Add a phone number to this client to send WhatsApp/SMS reminders.
          </Txt>
          <Btn variant="soft" label="Edit client" onPress={() => { onClose(); nav.go('newClient', { cid: client.id }); }} />
        </View>
      ) : (
        <>
          <Input value={text} onChangeText={setText} multiline style={{ minHeight: 120, textAlignVertical: 'top', marginBottom: 8 }} />
          <Cap style={{ marginBottom: 14 }}>To {phone.e164} · edit freely before sending</Cap>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Btn variant="primary" block icon="send" label="WhatsApp" style={{ flex: 1 }} onPress={sendWa} />
            <Btn variant="soft" block icon="message" label="SMS" style={{ flex: 1 }} onPress={sendSms} />
          </View>
          <View style={{ alignItems: 'center', marginTop: 10 }}>
            <Chip label="Copy text" onPress={copy} />
          </View>
        </>
      )}
    </Sheet>
  );
}
