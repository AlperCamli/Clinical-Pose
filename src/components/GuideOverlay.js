// ============ NATURE — single alignment-guide renderer ============
// Draws a per-angle capture overlay over the live preview. Precedence:
//   1. overlay.src    → the provided PNG (expected at the 1000×1400 design aspect).
//   2. overlay.shapes → normalized SVG primitives in DESIGN space.
//   3. otherwise      → the generic oval (never blank, never blocks capture).
//
// GEOMETRY: the camera preview fills the screen (cover), so the guide must use
// the SAME cover mapping — the 1000×1400 design box is scaled to COVER the
// measured viewport and centered (edges crop on tall screens). The previous
// `preserveAspectRatio="meet"` letterboxed the guide smaller than the preview,
// which is why guides never matched the captured photo's framing.
//
// Optional per-overlay calibration `cal: { scale, dx, dy }` (design units,
// scale about the design center) fine-tunes fit per guide — see overlayShapes.js.
//
// The shape→element mapping here MUST stay in sync with scripts/render-overlays.mjs
// (same viewBox, attributes, vector-effect, style tiers) so the browser preview is
// faithful. Adding/editing a guide happens in src/data/overlayShapes.js, not here.
import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import Svg, { Ellipse, Rect, Line, Path, G } from 'react-native-svg';
import { DESIGN } from '../data/overlays';

const C = (a) => `rgba(130,185,255,${a})`;

// one normalized primitive → an SVG element (design-space coords; strokes stay a
// uniform px via vector-effect regardless of the box size/aspect)
function Prim({ s }) {
  const common = {
    fill: 'none',
    stroke: s.soft ? C(0.6) : C(0.95),
    strokeWidth: s.soft ? 2 : 3,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeDasharray: s.dash ? '10 10' : undefined,
    vectorEffect: 'non-scaling-stroke',
  };
  const spin = (cx, cy) => (s.rot ? { rotation: s.rot, originX: cx, originY: cy } : null);
  switch (s.kind) {
    case 'ellipse':
      return <Ellipse cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} {...spin(s.cx, s.cy)} {...common} />;
    case 'rect':
      return <Rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r ?? 0} {...spin(s.x + s.w / 2, s.y + s.h / 2)} {...common} />;
    case 'line':
      return <Line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} {...common} />;
    case 'path':
      return <Path d={s.d} {...common} />;
    default:
      return null;
  }
}

const VIEWBOX = `0 0 ${DESIGN.W} ${DESIGN.H}`;
const ASPECT = DESIGN.W / DESIGN.H;

// design box → cover box for a measured viewport (same math the camera
// preview applies to its frames)
function coverBox(w, h) {
  if (w / h > ASPECT) {
    const bh = w / ASPECT;
    return { left: 0, top: (h - bh) / 2, width: w, height: bh };
  }
  const bw = h * ASPECT;
  return { left: (w - bw) / 2, top: 0, width: bw, height: h };
}

// calibration in design units → an SVG group transform about the design center
const calTransform = (cal) =>
  `translate(${cal.dx || 0},${cal.dy || 0}) translate(${DESIGN.W / 2},${DESIGN.H / 2}) scale(${cal.scale || 1}) translate(${-DESIGN.W / 2},${-DESIGN.H / 2})`;

export default function GuideOverlay({ overlay, opacity = 1, mirror = false }) {
  const [size, setSize] = React.useState(null);
  const onLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    if (!size || Math.abs(size.w - width) > 0.5 || Math.abs(size.h - height) > 0.5) setSize({ w: width, h: height });
  };

  // front-camera mirror, applied to the whole guide (flippable overlays only)
  const mirrorTf = mirror && overlay?.flippable ? [{ scaleX: -1 }] : [];

  const box = size ? coverBox(size.w, size.h) : null;
  const cal = overlay?.cal;

  let body = null;
  if (box) {
    if (overlay?.src) {
      // PNGs ship at the design aspect (assets/overlays/README) → exact-fit fill
      body = <Image source={overlay.src} style={{ width: '100%', height: '100%' }} resizeMode="stretch" />;
    } else {
      const shapes = overlay?.shapes?.length ? overlay.shapes : null;
      let inner = shapes
        ? shapes.map((s, i) => <Prim key={i} s={s} />)
        : [
          <Ellipse key="a" cx={DESIGN.W / 2} cy={728} rx={235} ry={462} fill="none" stroke={C(0.85)} strokeWidth={3} strokeDasharray="14 14" vectorEffect="non-scaling-stroke" />,
          <Rect key="b" x={290} y={560} width={420} height={119} rx={10} fill="none" stroke={C(0.7)} strokeWidth={2} strokeDasharray="12 12" vectorEffect="non-scaling-stroke" />,
        ];
      if (overlay?.flipX) inner = <G transform={`translate(${DESIGN.W},0) scale(-1,1)`}>{inner}</G>;
      if (cal) inner = <G transform={calTransform(cal)}>{inner}</G>;
      body = (
        <Svg width="100%" height="100%" viewBox={VIEWBOX}>
          {inner}
        </Svg>
      );
    }
  }

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity, overflow: 'hidden' }]} onLayout={onLayout}>
      {box && (
        <View
          style={{
            position: 'absolute', left: box.left, top: box.top, width: box.width, height: box.height,
            transform: [
              ...mirrorTf,
              // PNG calibration happens at the view level (SVG handles its own)
              ...(overlay?.src && cal ? [
                { translateX: (cal.dx || 0) * (box.width / DESIGN.W) },
                { translateY: (cal.dy || 0) * (box.height / DESIGN.H) },
                { scale: cal.scale || 1 },
              ] : []),
            ],
          }}
        >
          {body}
        </View>
      )}
    </View>
  );
}
