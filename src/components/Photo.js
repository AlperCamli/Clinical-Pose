// ============ NATURE — photo / face placeholder ============
// Renders the abstract clinical "subject" silhouette (no real image), or a real
// captured image. For real images it draws a NON-DESTRUCTIVE eye redaction from
// the stored normalized eye boxes (the original file is never modified).
import React from 'react';
import { View, StyleSheet, Image, Platform } from 'react-native';
import Svg, { Defs, Pattern, Rect, Ellipse, LinearGradient, Stop, ClipPath } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import Txt from './Txt';
import { C, R_SM } from '../theme';
import { coverRects } from '../data/eyeGeometry';
import { getStyle } from '../data/redactionStyles';

function Subject({ w, h, eyeHidden, eyeStyle, uid }) {
  if (!w || !h) return null;
  const pid = `stripe-${uid}`;
  const gid = `subj-${uid}`;
  const kind = getStyle(eyeStyle).kind;
  const eyeX = w * 0.24, eyeY = h * 0.34, eyeW = w * 0.52, eyeH = Math.max(8, h * 0.13);
  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
      <Defs>
        <Pattern id={pid} patternUnits="userSpaceOnUse" width={11} height={11} patternTransform="rotate(45)">
          <Rect x={0} y={0} width={11} height={11} fill="#e7ecf2" />
          <Rect x={0} y={0} width={2} height={11} fill="#dfe5ec" />
        </Pattern>
        <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#d6dde5" />
          <Stop offset="1" stopColor="#c4ccd6" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={w} height={h} fill={`url(#${pid})`} />
      <Ellipse cx={w * 0.5} cy={h * 0.54} rx={w * 0.26} ry={h * 0.37} fill={`url(#${gid})`} />
      {eyeHidden && kind === 'solid' && <Rect x={eyeX} y={eyeY} width={eyeW} height={eyeH} rx={6} fill={C.ink} />}
      {eyeHidden && kind === 'pixel' && (
        <>
          <Defs>
            <Pattern id={`px-${uid}`} patternUnits="userSpaceOnUse" width={9} height={9}>
              <Rect x={0} y={0} width={9} height={9} fill="#c2cad4" />
              <Rect x={0} y={0} width={4.5} height={4.5} fill="#aab4c0" />
              <Rect x={4.5} y={4.5} width={4.5} height={4.5} fill="#aab4c0" />
            </Pattern>
            <ClipPath id={`pxc-${uid}`}>
              <Rect x={eyeX} y={eyeY} width={eyeW} height={eyeH} rx={6} />
            </ClipPath>
          </Defs>
          <Rect x={eyeX} y={eyeY} width={eyeW} height={eyeH} fill={`url(#px-${uid})`} clipPath={`url(#pxc-${uid})`} />
        </>
      )}
      {eyeHidden && kind === 'blur' && (
        <Rect x={eyeX} y={eyeY} width={eyeW} height={eyeH} rx={6} fill="rgba(223,229,236,0.6)" stroke="rgba(255,255,255,0.5)" strokeWidth={1} />
      )}
    </Svg>
  );
}

// On-screen mapping (cover crop) lives in ../data/eyeGeometry so the editor and
// the renderer agree. `coverRects` here returns rects with a `rot` passthrough.

// One eye-cover block, rendered from a registry style def. `rect` is the on-screen
// rect (incl. rotation) from coverRects; `style` is a redactionStyles entry.
function RedactionMark({ rect, style, uid }) {
  const radius = Math.min(rect.width, rect.height) * (style.radiusFactor ?? 0.3);
  const wrap = {
    position: 'absolute', left: rect.left, top: rect.top, width: rect.width, height: rect.height,
    transform: [{ rotate: `${rect.rot || 0}deg` }],
  };

  if (style.kind === 'pixel') {
    const cell = style.cell || 10;
    return (
      <Svg style={wrap} width={rect.width} height={rect.height}>
        <Defs>
          <Pattern id={`rpx-${uid}`} patternUnits="userSpaceOnUse" width={cell} height={cell}>
            <Rect x={0} y={0} width={cell} height={cell} fill="#9aa4b1" />
            <Rect x={0} y={0} width={cell / 2} height={cell / 2} fill="#717b89" />
            <Rect x={cell / 2} y={cell / 2} width={cell / 2} height={cell / 2} fill="#717b89" />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width={rect.width} height={rect.height} rx={radius} fill={`url(#rpx-${uid})`} />
      </Svg>
    );
  }

  if (style.kind === 'solid') {
    return <View style={[wrap, { borderRadius: radius, backgroundColor: C.ink }]} />;
  }

  // blur: ONE uniform BlurView over the whole block, generously rounded so the
  // edges read soft. expo-blur is a uniform effect (it can't truly feather without
  // a native mask), so a single smooth layer beats stacking — no hard inner rect.
  const intensity = Platform.OS === 'android' ? style.androidIntensity : style.iosIntensity;
  return (
    <BlurView intensity={intensity} tint={style.tint || 'light'} experimentalBlurMethod="dimezisBlurView"
      style={[wrap, { borderRadius: radius, overflow: 'hidden' }]} />
  );
}

export default function Photo({
  uri, angleCode, badge, eyeHidden = true, eyeStyle = 'blur', variant = 'plain',
  eyeBoxes, imgW, imgH, dim = false, style, corners = false, overlayLabel, children,
}) {
  const flat = StyleSheet.flatten(style) || {};
  const radius = flat.borderRadius !== undefined ? flat.borderRadius : R_SM;
  const [size, setSize] = React.useState({
    w: typeof flat.width === 'number' ? flat.width : 0,
    h: typeof flat.height === 'number' ? flat.height : 0,
  });
  const uid = React.useId().replace(/[:]/g, '');

  const empty = variant === 'empty';
  const base = empty
    ? { backgroundColor: C.surface2, borderWidth: 1.5, borderColor: C.line2, borderStyle: 'dashed' }
    : { backgroundColor: '#e7ecf2', borderWidth: 1, borderColor: C.line2 };

  const redact = !empty && !!uri && eyeHidden && eyeBoxes?.length > 0;
  const rects = redact ? coverRects(eyeBoxes, size.w, size.h, imgW, imgH) : [];

  return (
    <View
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setSize((s) => (Math.abs(s.w - width) > 0.5 || Math.abs(s.h - height) > 0.5 ? { w: width, h: height } : s));
      }}
      style={[{ overflow: 'hidden', borderRadius: radius }, base, flat]}
    >
      {!empty && uri && <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
      {!empty && !uri && <Subject w={size.w} h={size.h} eyeHidden={eyeHidden} eyeStyle={eyeStyle} uid={uid} />}

      {/* non-destructive eye redaction over a real image */}
      {redact && rects.map((r, i) => (
        <RedactionMark key={i} rect={r} style={getStyle(eyeStyle)} uid={`${uid}-${i}`} />
      ))}

      {corners && (
        <>
          <View style={[s.corner, { left: 7, top: 7, borderRightWidth: 0, borderBottomWidth: 0 }]} />
          <View style={[s.corner, { right: 7, top: 7, borderLeftWidth: 0, borderBottomWidth: 0 }]} />
          <View style={[s.corner, { left: 7, bottom: 7, borderRightWidth: 0, borderTopWidth: 0 }]} />
          <View style={[s.corner, { right: 7, bottom: 7, borderLeftWidth: 0, borderTopWidth: 0 }]} />
        </>
      )}

      {!!angleCode && (
        <View style={s.anglelab}>
          <Txt mono style={s.anglelabTxt}>{angleCode}{badge ? ` · ${badge}` : ''}</Txt>
        </View>
      )}

      {overlayLabel && <View style={s.overlay}>{overlayLabel}</View>}
      {dim && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(28,37,48,0.04)' }]} />}
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  corner: { position: 'absolute', width: 13, height: 13, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)' },
  anglelab: {
    position: 'absolute', left: 8, bottom: 8, zIndex: 2,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: 'rgba(28,37,48,0.72)',
  },
  anglelabTxt: { fontSize: 9.5, fontWeight: '600', letterSpacing: 0.4, color: '#fff' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 6 },
});
