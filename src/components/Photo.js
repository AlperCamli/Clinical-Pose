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

function Subject({ w, h, eyeHidden, eyeStyle, uid }) {
  if (!w || !h) return null;
  const pid = `stripe-${uid}`;
  const gid = `subj-${uid}`;
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
      {eyeHidden && eyeStyle === 'bar' && <Rect x={eyeX} y={eyeY} width={eyeW} height={eyeH} rx={6} fill={C.ink} />}
      {eyeHidden && eyeStyle === 'pixel' && (
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
      {eyeHidden && eyeStyle !== 'bar' && eyeStyle !== 'pixel' && (
        <Rect x={eyeX} y={eyeY} width={eyeW} height={eyeH} rx={6} fill="rgba(223,229,236,0.6)" stroke="rgba(255,255,255,0.5)" strokeWidth={1} />
      )}
    </Svg>
  );
}

// Map normalized boxes (0..1 of the image) to on-screen rects, accounting for the
// `cover` crop of an imgW×imgH image inside a W×H container.
function coverRects(boxes, W, H, imgW, imgH) {
  if (!W || !H || !boxes?.length) return [];
  if (imgW && imgH) {
    const scale = Math.max(W / imgW, H / imgH);
    const dispW = imgW * scale, dispH = imgH * scale;
    const offX = (W - dispW) / 2, offY = (H - dispH) / 2;
    return boxes.map((b) => ({ left: offX + b.x * dispW, top: offY + b.y * dispH, width: b.w * dispW, height: b.h * dispH }));
  }
  return boxes.map((b) => ({ left: b.x * W, top: b.y * H, width: b.w * W, height: b.h * H }));
}

function PixelRect({ rect, uid }) {
  return (
    <Svg style={{ position: 'absolute', left: rect.left, top: rect.top }} width={rect.width} height={rect.height}>
      <Defs>
        <Pattern id={`rpx-${uid}`} patternUnits="userSpaceOnUse" width={10} height={10}>
          <Rect x={0} y={0} width={10} height={10} fill="#9aa4b1" />
          <Rect x={0} y={0} width={5} height={5} fill="#717b89" />
          <Rect x={5} y={5} width={5} height={5} fill="#717b89" />
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width={rect.width} height={rect.height} rx={6} fill={`url(#rpx-${uid})`} />
    </Svg>
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
      {redact && rects.map((r, i) => {
        if (eyeStyle === 'blur') {
          return (
            <BlurView
              key={i}
              intensity={Platform.OS === 'android' ? 90 : 60}
              tint="light"
              experimentalBlurMethod="dimezisBlurView"
              style={{ position: 'absolute', left: r.left, top: r.top, width: r.width, height: r.height, borderRadius: 6, overflow: 'hidden' }}
            />
          );
        }
        if (eyeStyle === 'pixel') return <PixelRect key={i} rect={r} uid={`${uid}-${i}`} />;
        return (
          <View key={i} style={{ position: 'absolute', left: r.left, top: r.top, width: r.width, height: r.height, borderRadius: 6, backgroundColor: C.ink }} />
        );
      })}

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
