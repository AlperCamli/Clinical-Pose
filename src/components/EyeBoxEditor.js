// ============ NATURE — eye-cover editor (multi-box, drag/resize/rotate) ============
// Wraps <Photo> (reusing its redaction rendering) and overlays a transparent
// gesture layer + a selection frame with corner/edge handles. Built on the
// built-in PanResponder (no native deps). Supports MULTIPLE boxes (e.g. two
// separate eye blocks so the nose stays visible).
//   • tap a box            → select it
//   • 1 finger on body     → drag to move
//   • drag a corner handle → resize both dimensions (opposite corner fixed)
//   • drag an edge handle  → resize one dimension (opposite edge fixed)
//   • 2 fingers            → uniform pinch-scale + rotate
//   • ＋ / ✕               → add / delete a box
// All boxes stay normalized to the image; onChange(boxes) fires live.
import React from 'react';
import { View, StyleSheet, PanResponder, Pressable } from 'react-native';
import Photo from './Photo';
import Icon from './Icon';
import { coverTransform } from '../data/eyeGeometry';

const MIN_W = 0.04, MIN_H = 0.03; // normalized minimums
const MIN_PX = 16;                // screen-space min while resizing
const HIT = 24;                   // handle touch radius (px)
const MAX_BOXES = 4;
const SELc = 'rgba(127,178,255,0.95)';

// 4 corners + 4 edges, expressed as local-axis signs (hx,hy) ∈ {-1,0,1}
const HANDLES = [
  { hx: -1, hy: -1 }, { hx: 1, hy: -1 }, { hx: 1, hy: 1 }, { hx: -1, hy: 1 },
  { hx: 0, hy: -1 }, { hx: 1, hy: 0 }, { hx: 0, hy: 1 }, { hx: -1, hy: 0 },
];

const clampN = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// rotate vector (vx,vy) by `deg` degrees
function rot(vx, vy, deg) {
  const t = (deg * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t);
  return { x: vx * c - vy * s, y: vx * s + vy * c };
}

// normalized box → screen representation { cx, cy, sw, sh, rot }
function toScreen(box, tf) {
  return {
    cx: tf.offX + (box.x + box.w / 2) * tf.dispW,
    cy: tf.offY + (box.y + box.h / 2) * tf.dispH,
    sw: box.w * tf.dispW,
    sh: box.h * tf.dispH,
    rot: box.rot || 0,
  };
}

function clampBox(b) {
  const w = clampN(b.w, MIN_W, 1);
  const h = clampN(b.h, MIN_H, 1);
  const cx = clampN(b.x + b.w / 2, 0, 1);
  const cy = clampN(b.y + b.h / 2, 0, 1);
  return { x: cx - w / 2, y: cy - h / 2, w, h, rot: b.rot || 0 };
}

// screen representation → normalized box
function fromScreen(rep, tf) {
  if (!tf.dispW || !tf.dispH) return { x: 0, y: 0, w: MIN_W, h: MIN_H, rot: rep.rot };
  return clampBox({
    x: (rep.cx - tf.offX) / tf.dispW - rep.sw / tf.dispW / 2,
    y: (rep.cy - tf.offY) / tf.dispH - rep.sh / tf.dispH / 2,
    w: rep.sw / tf.dispW,
    h: rep.sh / tf.dispH,
    rot: rep.rot,
  });
}

function twoFinger(ts) {
  const dx = ts[1].pageX - ts[0].pageX, dy = ts[1].pageY - ts[0].pageY;
  return { dist: Math.hypot(dx, dy) || 1, ang: Math.atan2(dy, dx) };
}

export default function EyeBoxEditor({ uri, imgW, imgH, boxes = [], eyeStyle = 'blur', onChange, style }) {
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  const [selected, setSelected] = React.useState(0);

  const boxesRef = React.useRef(boxes); boxesRef.current = boxes;
  const sizeRef = React.useRef(size); sizeRef.current = size;
  const dimRef = React.useRef({ imgW, imgH }); dimRef.current = { imgW, imgH };
  const selRef = React.useRef(selected); selRef.current = selected;
  const start = React.useRef(null);

  const tf = () => coverTransform(sizeRef.current.w, sizeRef.current.h, dimRef.current.imgW, dimRef.current.imgH);
  const setSel = (i) => { selRef.current = i; setSelected(i); };

  const commit = (idx, box) => {
    const next = boxesRef.current.slice();
    next[idx] = box;
    onChange(next);
  };

  // decide what a touch acts on (handles of the selected box → any box body → none)
  const hitTest = (px, py) => {
    const t = tf();
    const bs = boxesRef.current;
    const sel = selRef.current;
    if (bs[sel]) {
      const rep = toScreen(bs[sel], t);
      for (const hd of HANDLES) {
        const off = rot((hd.hx * rep.sw) / 2, (hd.hy * rep.sh) / 2, rep.rot);
        if (Math.hypot(px - (rep.cx + off.x), py - (rep.cy + off.y)) <= HIT) {
          return { mode: 'resize', idx: sel, hx: hd.hx, hy: hd.hy };
        }
      }
    }
    for (let i = bs.length - 1; i >= 0; i--) {
      const rep = toScreen(bs[i], t);
      const d = rot(px - rep.cx, py - rep.cy, -rep.rot);
      if (Math.abs(d.x) <= rep.sw / 2 && Math.abs(d.y) <= rep.sh / 2) return { mode: 'drag', idx: i };
    }
    return { mode: 'none' };
  };

  const pan = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        const ts = e.nativeEvent.touches;
        if (ts.length >= 2) {
          const sel = selRef.current;
          start.current = { mode: 'transform', idx: sel, box: boxesRef.current[sel], two: twoFinger(ts) };
          return;
        }
        const hit = hitTest(e.nativeEvent.locationX, e.nativeEvent.locationY);
        if (hit.mode === 'none') { start.current = { mode: 'none' }; return; }
        if (hit.idx !== selRef.current) setSel(hit.idx);
        const box = boxesRef.current[hit.idx];
        start.current = { ...hit, box, rep: toScreen(box, tf()), px: ts[0].pageX, py: ts[0].pageY };
      },
      onPanResponderMove: (e) => {
        const st = start.current;
        if (!st || st.mode === 'none') return;
        const t = tf();
        const ts = e.nativeEvent.touches;

        // two fingers → uniform scale + rotate of the active box
        if (ts.length >= 2) {
          if (st.mode !== 'transform') { const sel = selRef.current; start.current = { mode: 'transform', idx: sel, box: boxesRef.current[sel], two: twoFinger(ts) }; return; }
          const now = twoFinger(ts);
          const scale = now.dist / st.two.dist;
          const b = st.box;
          const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
          const nw = b.w * scale, nh = b.h * scale;
          const nrot = (b.rot || 0) + ((now.ang - st.two.ang) * 180) / Math.PI;
          commit(st.idx, clampBox({ x: cx - nw / 2, y: cy - nh / 2, w: nw, h: nh, rot: nrot }));
          return;
        }

        // dropped from two fingers to one → continue as a drag
        if (st.mode === 'transform') {
          const sel = selRef.current; const box = boxesRef.current[sel];
          start.current = { mode: 'drag', idx: sel, box, rep: toScreen(box, t), px: ts[0].pageX, py: ts[0].pageY };
          return;
        }

        const dx = ts[0].pageX - st.px, dy = ts[0].pageY - st.py;

        if (st.mode === 'drag') {
          commit(st.idx, fromScreen({ ...st.rep, cx: st.rep.cx + dx, cy: st.rep.cy + dy }, t));
        } else if (st.mode === 'resize') {
          const th = st.rep.rot;
          const l = rot(dx, dy, -th); // delta in the box's local axes
          let sw = st.hx === 0 ? st.rep.sw : Math.max(MIN_PX, st.rep.sw + st.hx * l.x);
          let sh = st.hy === 0 ? st.rep.sh : Math.max(MIN_PX, st.rep.sh + st.hy * l.y);
          // keep the opposite anchor fixed in screen space
          const a0 = rot((-st.hx * st.rep.sw) / 2, (-st.hy * st.rep.sh) / 2, th);
          const anchor = { x: st.rep.cx + a0.x, y: st.rep.cy + a0.y };
          const a1 = rot((-st.hx * sw) / 2, (-st.hy * sh) / 2, th);
          commit(st.idx, fromScreen({ cx: anchor.x - a1.x, cy: anchor.y - a1.y, sw, sh, rot: th }, t));
        }
      },
      onPanResponderRelease: () => { start.current = null; },
      onPanResponderTerminate: () => { start.current = null; },
    })
  ).current;

  const addBox = () => {
    if (boxesRef.current.length >= MAX_BOXES) return;
    const next = boxesRef.current.concat([{ x: 0.42, y: 0.42, w: 0.16, h: 0.1, rot: 0 }]);
    onChange(next);
    setSel(next.length - 1);
  };
  const delBox = () => {
    const sel = selRef.current;
    if (!boxesRef.current[sel]) return;
    const next = boxesRef.current.slice(); next.splice(sel, 1);
    onChange(next);
    setSel(Math.max(0, sel - 1));
  };

  const t = coverTransform(size.w, size.h, imgW, imgH);
  const sel = Math.min(selected, boxes.length - 1);
  const selRep = (size.w && size.h && boxes[sel]) ? toScreen(boxes[sel], t) : null;

  return (
    <View
      onLayout={(e) => { const { width, height } = e.nativeEvent.layout; setSize((sz) => (Math.abs(sz.w - width) > 0.5 || Math.abs(sz.h - height) > 0.5 ? { w: width, h: height } : sz)); }}
      style={[{ overflow: 'hidden' }, style]}
    >
      <Photo uri={uri} eyeBoxes={boxes} imgW={imgW} imgH={imgH} eyeStyle={eyeStyle} eyeHidden
        variant="plain" style={[StyleSheet.absoluteFill, { borderRadius: 0, borderWidth: 0 }]} />

      {/* faint outline on non-selected boxes so multiple blocks read as separate */}
      {size.w > 0 && boxes.map((b, i) => {
        if (i === sel) return null;
        const r = toScreen(b, t);
        return (
          <View key={i} pointerEvents="none" style={{
            position: 'absolute', left: r.cx - r.sw / 2, top: r.cy - r.sh / 2, width: r.sw, height: r.sh,
            transform: [{ rotate: `${r.rot}deg` }], borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
          }} />
        );
      })}

      {/* selection frame + handles */}
      {selRep && (
        <View pointerEvents="none" style={{
          position: 'absolute', left: selRep.cx - selRep.sw / 2, top: selRep.cy - selRep.sh / 2,
          width: selRep.sw, height: selRep.sh, transform: [{ rotate: `${selRep.rot}deg` }],
          borderWidth: 1.5, borderColor: SELc, borderStyle: 'dashed', borderRadius: 6,
        }}>
          {[['left', 'top'], ['right', 'top'], ['right', 'bottom'], ['left', 'bottom']].map(([hx, hy], i) => (
            <View key={'c' + i} style={{ position: 'absolute', [hx]: -6, [hy]: -6, width: 12, height: 12, borderRadius: 6, backgroundColor: '#fff', borderWidth: 1.5, borderColor: SELc }} />
          ))}
          <View style={{ position: 'absolute', left: '50%', top: -5, marginLeft: -7, width: 14, height: 10, borderRadius: 3, backgroundColor: '#fff', borderWidth: 1.5, borderColor: SELc }} />
          <View style={{ position: 'absolute', left: '50%', bottom: -5, marginLeft: -7, width: 14, height: 10, borderRadius: 3, backgroundColor: '#fff', borderWidth: 1.5, borderColor: SELc }} />
          <View style={{ position: 'absolute', top: '50%', left: -5, marginTop: -7, width: 10, height: 14, borderRadius: 3, backgroundColor: '#fff', borderWidth: 1.5, borderColor: SELc }} />
          <View style={{ position: 'absolute', top: '50%', right: -5, marginTop: -7, width: 10, height: 14, borderRadius: 3, backgroundColor: '#fff', borderWidth: 1.5, borderColor: SELc }} />
        </View>
      )}

      {/* gesture layer (below the controls so the buttons still get taps) */}
      <View {...pan.panHandlers} style={StyleSheet.absoluteFill} />

      {/* add / delete */}
      <View style={{ position: 'absolute', top: 8, right: 8, flexDirection: 'row', gap: 8 }}>
        <Pressable onPress={addBox} disabled={boxes.length >= MAX_BOXES} style={ctrl(boxes.length >= MAX_BOXES)}>
          <Icon name="plus" size={16} color="#fff" />
        </Pressable>
        <Pressable onPress={delBox} disabled={boxes.length === 0} style={ctrl(boxes.length === 0)}>
          <Icon name="x" size={15} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const ctrl = (disabled) => ({
  width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
  backgroundColor: disabled ? 'rgba(20,28,38,0.28)' : 'rgba(20,28,38,0.62)',
});
