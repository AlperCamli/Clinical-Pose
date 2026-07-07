// ============ NATURE — client messaging (templates + deep links) ============
// No backend: messages open the phone's own WhatsApp/SMS composer pre-filled,
// so the doctor stays in control of every send (and pays nothing per message).
// Templates default to Turkish (src/data/treatments.js); per-clinic overrides
// are stored in settings under 'tpl:<treatmentId>'.
import { Platform, Linking } from 'react-native';
import { TREATMENTS } from './treatments';

// {token} substitution; unknown tokens are left visible so a typo in a custom
// template is noticeable instead of silently dropped.
export function renderTemplate(str, ctx) {
  return String(str || '').replace(/\{(\w+)\}/g, (m, k) => (ctx[k] != null ? String(ctx[k]) : m));
}

// Clinic override → treatment default → generic default.
export function getTemplate(getSetting, tid, field) {
  const key = tid || 'custom';
  const override = getSetting(`tpl:${key}`, null);
  if (override && override[field]) return override[field];
  return TREATMENTS[key]?.msg?.[field] ?? TREATMENTS.custom.msg[field];
}

// Messages are Turkish → dates render in Turkish ("5 Temmuz 2026").
const trDate = (ms) => new Date(ms).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
const trTime = (ms) => {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// Assemble the token context + render one template field.
// opts: { client, tid, startAt?, practitioner?, getSetting }
export function buildMessage(field, { client, tid, startAt, practitioner, getSetting }) {
  const ctx = {
    client: client?.name || '',
    clinic: getSetting('clinicName'),
    doctor: practitioner || getSetting('doctorName'),
    treatment: TREATMENTS[tid || 'custom']?.nameTr || '',
    date: startAt ? trDate(startAt) : '',
    time: startAt ? trTime(startAt) : '',
  };
  return renderTemplate(getTemplate(getSetting, tid, field), ctx);
}

// Turkish-first E.164 normalization: '0532…', '532…', '90 532…', '+90 532…'
// all → +905… Returns { e164, digits } or null when it can't be a real number.
export function normalizePhone(raw) {
  if (!raw) return null;
  let d = String(raw).replace(/[^\d+]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  if (d.startsWith('0') && d.length === 11) d = '90' + d.slice(1);
  else if (d.length === 10 && d.startsWith('5')) d = '90' + d;
  if (d.length < 11 || /\D/.test(d)) return null;
  return { e164: '+' + d, digits: d };
}

export const waUrl = (digits, text) => `whatsapp://send?phone=${digits}&text=${encodeURIComponent(text)}`;
export const waWebUrl = (digits, text) => `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
// The body separator differs by platform (iOS '&', Android '?').
export const smsUrl = (e164, text) =>
  `sms:${e164}${Platform.OS === 'ios' ? '&' : '?'}body=${encodeURIComponent(text)}`;

// Open WhatsApp with the app scheme, falling back to the universal wa.me link
// (which routes through the browser to WhatsApp/WhatsApp Web).
export async function openWhatsApp(digits, text) {
  try {
    await Linking.openURL(waUrl(digits, text));
    return true;
  } catch {
    try {
      await Linking.openURL(waWebUrl(digits, text));
      return true;
    } catch {
      return false;
    }
  }
}

export async function openSMS(e164, text) {
  try {
    await Linking.openURL(smsUrl(e164, text));
    return true;
  } catch {
    return false;
  }
}
