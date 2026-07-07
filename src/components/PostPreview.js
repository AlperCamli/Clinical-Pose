// ============ NATURE — social post preview (shared renderer) ============
// Renders ONE post slide for the angle in `cfg.sel[0]` (carousel exports drive
// this once per selected angle). Real captured before/after images are resolved
// from the client graph; <Photo> bakes the eye redaction, so a snapshot of this
// component is privacy-safe by construction.
import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Txt from './Txt';
import Icon from './Icon';
import Photo from './Photo';
import { C } from '../theme';
import { TREATMENTS } from '../data/treatments';
import { fmtDate, reqAngles, beforeAfter, capturedSessions } from '../data/helpers';
import { todayISO } from '../data/clock';

const RATIO = { '1:1': 1, '4:5': 0.8, '9:16': 0.5625 };

// `bare` strips every text overlay (BEFORE/AFTER labels, disclaimer, meta + logo)
// so tiny list thumbnails show only the photos.
export default function PostPreview({ cfg, t, c, cs, size, bare }) {
  if (!cs) return null;
  const ratio = RATIO[cfg.format] || 1;
  const W = size || 260;
  const H = W / ratio;
  const eye = cfg.privacy?.eyes !== 'visible';
  const eyeStyle = t?.eyeStyle;
  const noBg = !!cfg.privacy?.bgRemove; // remove background → solid black backdrop
  const tmpl = cfg.template || 'split';
  const photoStyle = { borderRadius: 0, borderWidth: 0, height: '100%' };

  // resolve the angle + its real before/after sessions (falls back to the first
  // required angle when no explicit selection — e.g. the template thumbnails)
  const angleId = cfg.sel?.[0] ?? reqAngles(cs.treatment)[0].id;
  const { before, after } = beforeAfter(cs, angleId);
  const ph = (s) => {
    const p = s?.photos?.[angleId];
    return { uri: p?.uri, eyeBoxes: p?.eyeBoxes, imgW: p?.imgW, imgH: p?.imgH, fileMissing: p?.fileMissing };
  };
  const tl = capturedSessions(cs, angleId);
  const tlCells = tl.length ? tl : [null, null, null]; // keep the 3-cell look when nothing's captured

  const dateFrom = before?.date || cs.started;
  const dateTo = after?.date || todayISO();

  return (
    <View style={{ width: W, height: H, borderRadius: 14, overflow: 'hidden', backgroundColor: '#0c0f14' }}>
      {tmpl === 'split' && (
        <View style={{ flexDirection: 'row', height: '100%', gap: 2 }}>
          <View style={{ flex: 1 }}>
            <Photo eyeHidden={eye} eyeStyle={eyeStyle} bgRemove={noBg} {...ph(before)} variant="plain" style={photoStyle} />
            {!bare && <Label text="BEFORE" />}
          </View>
          <View style={{ flex: 1 }}>
            <Photo eyeHidden={eye} eyeStyle={eyeStyle} bgRemove={noBg} {...ph(after)} variant="plain" style={photoStyle} />
            {!bare && <Label text="AFTER" ok />}
          </View>
        </View>
      )}
      {tmpl === 'slider' && (
        <View style={{ height: '100%' }}>
          <Photo eyeHidden={eye} eyeStyle={eyeStyle} bgRemove={noBg} {...ph(before)} variant="plain" style={photoStyle} />
          {/* after, revealed in the right half and right-anchored so it aligns with the frame */}
          <View style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', right: 0, overflow: 'hidden' }}>
            <Photo eyeHidden={eye} eyeStyle={eyeStyle} bgRemove={noBg} {...ph(after)} variant="plain" style={{ ...photoStyle, position: 'absolute', right: 0, width: W }} />
          </View>
          <View style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 2, backgroundColor: '#fff' }} />
          {!bare && <Label text="BEFORE" />}
          {!bare && <View style={{ position: 'absolute', right: 6, top: 6 }}><Label text="AFTER" ok inline /></View>}
        </View>
      )}
      {tmpl === 'timeline' && (
        <View style={{ flexDirection: 'row', height: '100%', gap: 2 }}>
          {tlCells.map((s, i) => (
            <View key={s?.id || i} style={{ flex: 1 }}>
              <Photo eyeHidden={eye} eyeStyle={eyeStyle} bgRemove={noBg} {...ph(s)} variant="plain" style={photoStyle} />
            </View>
          ))}
        </View>
      )}
      {tmpl === 'single' && <Photo eyeHidden={eye} eyeStyle={eyeStyle} bgRemove={noBg} {...ph(after)} variant="plain" style={photoStyle} />}

      {!bare && cfg.privacy?.disclaimer && (
        <View style={{ position: 'absolute', top: 8, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.35)', paddingVertical: 2, paddingHorizontal: 7, borderRadius: 6 }}>
          <Txt mono style={{ fontSize: 8, color: 'rgba(255,255,255,0.7)' }}>INDIVIDUAL RESULTS VARY</Txt>
        </View>
      )}

      {/* meta + logo */}
      {!bare && (
        <LinearGradient colors={['transparent', 'rgba(12,16,22,0.62)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            {cfg.privacy?.name && <Txt style={{ fontWeight: '700', fontSize: 13, color: '#fff' }}>{c.name}</Txt>}
            {cfg.privacy?.treatment && <Txt mono style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)' }}>{TREATMENTS[cs.treatment].name}</Txt>}
            {cfg.privacy?.doctor && cs.practitioner && <Txt mono style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.7)' }}>{cs.practitioner}</Txt>}
            {cfg.privacy?.date && <Txt mono style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.7)' }}>{fmtDate(dateFrom)} → {fmtDate(dateTo)}</Txt>}
          </View>
          {cfg.privacy?.logo !== false && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 16, height: 16, borderRadius: 5, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="camera" size={9} color="#fff" />
              </View>
              <Txt style={{ fontWeight: '700', fontSize: 11, color: '#fff' }}>Nature</Txt>
            </View>
          )}
        </LinearGradient>
      )}
    </View>
  );
}

function Label({ text, ok, inline }) {
  const box = {
    paddingVertical: 3, paddingHorizontal: 7, borderRadius: 6,
    backgroundColor: ok ? C.ok : 'rgba(28,37,48,0.72)',
  };
  return (
    <View style={inline ? box : { position: 'absolute', left: 6, top: 6, ...box }}>
      <Txt mono style={{ fontSize: 9.5, fontWeight: '600', letterSpacing: 0.4, color: '#fff' }}>{text}</Txt>
    </View>
  );
}
