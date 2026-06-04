// ============ NATURE — social post preview (shared renderer) ============
import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Txt from './Txt';
import Icon from './Icon';
import Photo from './Photo';
import { C } from '../theme';
import { TREATMENTS } from '../data/treatments';
import { fmtDate, TODAY } from '../data/helpers';

const RATIO = { '1:1': 1, '4:5': 0.8, '9:16': 0.5625 };

export default function PostPreview({ cfg, t, c, cs, size }) {
  const ratio = RATIO[cfg.format] || 1;
  const W = size || 260;
  const H = W / ratio;
  const eye = cfg.privacy?.eyes !== 'visible';
  const tmpl = cfg.template || 'split';
  const photoStyle = { borderRadius: 0, borderWidth: 0, height: '100%' };

  return (
    <View style={{ width: W, height: H, borderRadius: 14, overflow: 'hidden', backgroundColor: '#0c0f14' }}>
      {tmpl === 'split' && (
        <View style={{ flexDirection: 'row', height: '100%', gap: 2 }}>
          <View style={{ flex: 1 }}>
            <Photo eyeHidden={eye} eyeStyle={t.eyeStyle} variant="plain" style={photoStyle} />
            <Label text="BEFORE" />
          </View>
          <View style={{ flex: 1 }}>
            <Photo eyeHidden={eye} eyeStyle={t.eyeStyle} variant="plain" style={photoStyle} />
            <Label text="AFTER" ok />
          </View>
        </View>
      )}
      {tmpl === 'slider' && (
        <View style={{ height: '100%' }}>
          <Photo eyeHidden={eye} eyeStyle={t.eyeStyle} variant="plain" style={photoStyle} />
          <View style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', right: 0, overflow: 'hidden' }}>
            <Photo eyeHidden={eye} eyeStyle={t.eyeStyle} variant="plain" style={{ ...photoStyle, width: W }} />
          </View>
          <View style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 2, backgroundColor: '#fff' }} />
        </View>
      )}
      {tmpl === 'timeline' && (
        <View style={{ flexDirection: 'row', height: '100%', gap: 2 }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ flex: 1 }}>
              <Photo eyeHidden={eye} eyeStyle={t.eyeStyle} variant="plain" style={photoStyle} />
            </View>
          ))}
        </View>
      )}
      {tmpl === 'single' && <Photo eyeHidden={eye} eyeStyle={t.eyeStyle} variant="plain" style={photoStyle} />}

      {cfg.privacy?.disclaimer && (
        <View style={{ position: 'absolute', top: 8, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.35)', paddingVertical: 2, paddingHorizontal: 7, borderRadius: 6 }}>
          <Txt mono style={{ fontSize: 8, color: 'rgba(255,255,255,0.7)' }}>INDIVIDUAL RESULTS VARY</Txt>
        </View>
      )}

      {/* meta + logo */}
      <LinearGradient colors={['transparent', 'rgba(12,16,22,0.62)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <View>
          {cfg.privacy?.name && <Txt style={{ fontWeight: '700', fontSize: 13, color: '#fff' }}>{c.name}</Txt>}
          {cfg.privacy?.treatment && <Txt mono style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)' }}>{TREATMENTS[cs.treatment].name}</Txt>}
          {cfg.privacy?.date && <Txt mono style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.7)' }}>{fmtDate(cs.started)} → {fmtDate(TODAY)}</Txt>}
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
    </View>
  );
}

function Label({ text, ok }) {
  return (
    <View style={{ position: 'absolute', left: 6, top: 6, paddingVertical: 3, paddingHorizontal: 7, borderRadius: 6, backgroundColor: ok ? C.ok : 'rgba(28,37,48,0.72)' }}>
      <Txt mono style={{ fontSize: 9.5, fontWeight: '600', letterSpacing: 0.4, color: '#fff' }}>{text}</Txt>
    </View>
  );
}
