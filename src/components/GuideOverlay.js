// ============ NATURE — single alignment-guide renderer ============
// Draws a per-angle capture overlay over the live preview. Render precedence:
//   1. overlay.src    → the provided PNG, full-viewport (image overrides the SVG).
//   2. overlay.shapes → normalized SVG primitives drawn in viewport space.
//   3. otherwise      → the generic dashed oval (never blank, never blocks capture).
// This is the ONLY place that knows how to draw a guide — adding an overlay never
// touches this file.
import React from 'react';
import { Image, StyleSheet } from 'react-native';
import Svg, { Ellipse, Rect, Line } from 'react-native-svg';

const GUIDE = 'rgba(120,180,255,0.85)';
const pct = (v) => `${v * 100}%`; // normalized 0..1 → viewport percentage

// One normalized primitive → an SVG element (percentage coords adapt to the viewport
// aspect, like the original dashed guide; strokes stay a uniform 2px).
function Prim({ s }) {
  const common = {
    stroke: GUIDE, strokeWidth: 2, fill: 'none',
    strokeLinecap: 'round', strokeLinejoin: 'round',
    strokeDasharray: s.dash ? '6 6' : undefined,
  };
  switch (s.kind) {
    case 'ellipse':
      return <Ellipse cx={pct(s.cx)} cy={pct(s.cy)} rx={pct(s.rx)} ry={pct(s.ry)} {...common} />;
    case 'rect':
      return <Rect x={pct(s.x)} y={pct(s.y)} width={pct(s.w)} height={pct(s.h)} rx={s.r ?? 4} {...common} />;
    case 'line':
      return <Line x1={pct(s.x1)} y1={pct(s.y1)} x2={pct(s.x2)} y2={pct(s.y2)} {...common} />;
    default:
      return null;
  }
}

export default function GuideOverlay({ overlay, opacity = 1, mirror = false }) {
  // mirror only flippable guides (oblique/profile/cheek) so left/right read correctly
  // against the mirrored front-camera selfie preview.
  const transform = mirror && overlay?.flippable ? [{ scaleX: -1 }] : undefined;

  // 1) provided PNG wins
  if (overlay?.src) {
    return (
      <Image
        source={overlay.src}
        pointerEvents="none"
        resizeMode="contain"
        style={[StyleSheet.absoluteFill, { opacity, transform }]}
      />
    );
  }

  // 2) authored SVG-primitive guide
  if (overlay?.shapes?.length) {
    return (
      <Svg pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity, transform }]} width="100%" height="100%">
        {overlay.shapes.map((s, i) => <Prim key={i} s={s} />)}
      </Svg>
    );
  }

  // 3) generic dashed fallback
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Ellipse cx="50%" cy="52%" rx="23%" ry="33%" fill="none" stroke={GUIDE} strokeWidth={2} strokeDasharray="7 7" />
      <Rect x="29%" y="40%" width="42%" height="9%" rx={5} fill="none" stroke="rgba(120,180,255,0.7)" strokeWidth={2} strokeDasharray="6 6" />
    </Svg>
  );
}
