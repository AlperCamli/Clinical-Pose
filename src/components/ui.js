// ============ NATURE — shared UI primitives (ported from ui.jsx + tokens) ============
import React from 'react';
import {
  View, Pressable, StyleSheet, TextInput, Modal, PanResponder, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Txt from './Txt';
import Icon from './Icon';
import { C, R, R_SM, PAD, shadowCard, shadowPop, shadowBtn } from '../theme';

// ---------- Card ----------
export function Card({ pad, flat, onPress, style, children, ...rest }) {
  const st = [s.card, !flat && shadowCard, pad && { padding: PAD }, style];
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [...st, pressed && { transform: [{ scale: 0.99 }] }]} {...rest}>
        {children}
      </Pressable>
    );
  }
  return <View style={st} {...rest}>{children}</View>;
}

// ---------- IconBtn ----------
export function IconBtn({ name, size = 20, color = C.ink, bare, onPress, style, accessibilityLabel }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        s.iconbtn,
        bare && { backgroundColor: 'transparent', borderWidth: 0 },
        pressed && { transform: [{ scale: 0.93 }], backgroundColor: bare ? 'transparent' : C.surface2 },
        style,
      ]}
    >
      <Icon name={name} size={size} color={color} />
    </Pressable>
  );
}

// ---------- Button ----------
export function Btn({
  variant = 'default', lg, block, disabled, onPress,
  icon, iconRight, iconSize, label, children, style, textStyle, color,
}) {
  const palette = {
    default: { bg: C.surface, border: C.line2, fg: C.ink, shadow: null },
    primary: { bg: C.accent, border: 'transparent', fg: '#fff', shadow: shadowBtn },
    soft: { bg: C.accentWash, border: 'transparent', fg: C.accentInk, shadow: null },
    ghost: { bg: 'transparent', border: 'transparent', fg: C.accentInk, shadow: null },
  }[variant];
  const fg = color || palette.fg;
  const isz = iconSize || (lg ? 19 : 18);
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: palette.bg, borderColor: palette.border, borderRadius: lg ? 16 : 14 },
        lg ? { paddingVertical: 16, paddingHorizontal: 20 } : { paddingVertical: 13, paddingHorizontal: 18 },
        palette.shadow,
        block && { width: '100%' },
        disabled && { opacity: 0.45 },
        pressed && { transform: [{ scale: 0.985 }] },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={isz} color={fg} />}
      {label != null && <Txt style={[{ fontWeight: '600', fontSize: lg ? 16 : 15, color: fg }, textStyle]}>{label}</Txt>}
      {children}
      {iconRight && <Icon name={iconRight} size={isz} color={fg} />}
    </Pressable>
  );
}

// ---------- Chip ----------
export function Chip({ on, accent, icon, iconColor, label, onPress, children, style, textStyle }) {
  const bg = on ? (accent ? C.accent : C.ink) : C.surface;
  const fg = on ? '#fff' : C.ink2;
  const border = on ? (accent ? C.accent : C.ink) : C.line2;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.chip, { backgroundColor: bg, borderColor: border }, pressed && { transform: [{ scale: 0.96 }] }, style]}
    >
      {icon && <Icon name={icon} size={14} color={iconColor || (textStyle && StyleSheet.flatten(textStyle).color) || fg} />}
      {label != null && <Txt style={[{ fontSize: 13.5, fontWeight: '600', color: fg }, textStyle]}>{label}</Txt>}
      {children}
    </Pressable>
  );
}

// ---------- Tag ----------
const TAG_COLORS = {
  default: { bg: C.surface2, fg: C.ink2 },
  ok: { bg: C.okWash, fg: C.ok },
  warn: { bg: C.warnWash, fg: C.warn },
  miss: { bg: C.missWash, fg: C.miss },
  accent: { bg: C.accentWash, fg: C.accentInk },
  danger: { bg: C.dangerWash, fg: C.danger },
};
export function Tag({ variant = 'default', dot, icon, iconSize = 11, children, style, color }) {
  const p = TAG_COLORS[variant] || TAG_COLORS.default;
  const fg = color || p.fg;
  const label = typeof children === 'string' ? children.toUpperCase() : children;
  return (
    <View style={[s.tag, { backgroundColor: p.bg }, style]}>
      {dot && <View style={{ width: 6, height: 6, borderRadius: 99, backgroundColor: fg }} />}
      {icon && <Icon name={icon} size={iconSize} color={fg} />}
      {children != null && <Txt mono style={{ fontSize: 10.5, fontWeight: '600', letterSpacing: 0.3, color: fg }}>{label}</Txt>}
    </View>
  );
}

// ---------- StatusTag ----------
export function StatusTag({ status }) {
  const map = {
    captured: ['ok', 'Captured'], missing: ['miss', 'Missing'],
    retake: ['warn', 'Retake'], optional: ['accent', 'Optional'], skipped: ['miss', 'Skipped'],
  };
  const [variant, label] = map[status] || map.missing;
  return <Tag variant={variant} dot>{label}</Tag>;
}

// ---------- Avatar ----------
export function Avatar({ initials, size = 44 }) {
  return (
    <LinearGradient
      colors={['#dbe7ff', '#cdd7ff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }}
    >
      <Txt style={{ color: C.accentInk, fontWeight: '700', fontSize: size * 0.36 }}>{initials}</Txt>
    </LinearGradient>
  );
}

// ---------- Switch ----------
export function Switch({ on, onChange }) {
  return (
    <Pressable
      onPress={() => onChange(!on)}
      accessibilityRole="switch"
      accessibilityState={{ checked: !!on }}
      style={[s.switch, on && { backgroundColor: C.accent, borderColor: C.accent }]}
    >
      <View style={[s.knob, { left: on ? 22 : 2 }]} />
    </Pressable>
  );
}

// ---------- Segmented ----------
export function Segmented({ options, value, onChange }) {
  return (
    <View style={s.seg}>
      {options.map((o) => {
        const val = typeof o === 'string' ? o : o.v;
        const lab = typeof o === 'string' ? o : o.l;
        const active = value === val;
        return (
          <Pressable key={val} onPress={() => onChange(val)} style={[s.segBtn, active && s.segBtnOn]}>
            <Txt style={{ fontWeight: '600', fontSize: 13.5, color: active ? C.ink : C.ink2 }}>{lab}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------- Steps ----------
export function Steps({ n, cur }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {Array.from({ length: n }).map((_, i) => (
        <View key={i} style={{ flex: 1, height: 5, borderRadius: 99, backgroundColor: i <= cur ? C.accent : C.surface3 }} />
      ))}
    </View>
  );
}

// ---------- TopBar ----------
export function TopBar({ title, sub, onBack, right, border, accentTitle }) {
  return (
    <View style={[s.topbar, border && { borderBottomWidth: 1, borderBottomColor: C.line, backgroundColor: C.paper }]}>
      {onBack && <IconBtn name="back" size={20} onPress={onBack} accessibilityLabel="Back" />}
      {title !== undefined && (
        <View style={{ flex: 1 }}>
          <Txt style={{ fontWeight: '700', fontSize: 19, letterSpacing: -0.3, color: accentTitle ? C.accentInk : C.ink }}>{title}</Txt>
          {sub ? <Txt style={{ fontWeight: '500', fontSize: 12.5, color: C.ink3, marginTop: 1 }}>{sub}</Txt> : null}
        </View>
      )}
      {right}
    </View>
  );
}

// ---------- ActionBar (bottom CTA) ----------
export function ActionBar({ children }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={['rgba(246,248,250,0)', C.paper]}
      locations={[0, 0.4]}
      style={{ paddingHorizontal: PAD, paddingTop: 12, paddingBottom: 12 + Math.max(insets.bottom, 4) }}
    >
      {children}
    </LinearGradient>
  );
}

// ---------- Field ----------
export function Field({ label, hint, children, style }) {
  return (
    <View style={[{ marginBottom: 14 }, style]}>
      {label != null && (
        <Txt style={{ fontSize: 12.5, fontWeight: '600', color: C.ink2, marginBottom: 7, marginLeft: 3 }}>
          {label}
          {hint ? <Txt style={{ color: C.ink3, fontWeight: '600' }}> {hint}</Txt> : null}
        </Txt>
      )}
      {children}
    </View>
  );
}

// ---------- Input ----------
export function Input({ style, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <TextInput
      placeholderTextColor={C.ink3}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={[s.input, focus && { borderColor: C.accent }, style]}
      {...rest}
    />
  );
}

// ---------- SecLabel ----------
export function SecLabel({ children, style }) {
  return (
    <Txt style={[{ fontSize: 12, fontWeight: '700', letterSpacing: 0.5, color: C.ink3, marginHorizontal: 3, marginTop: 2, marginBottom: 10 }, style]}>
      {String(children).toUpperCase()}
    </Txt>
  );
}

// ---------- Cap (small caption / disclaimer row) ----------
export function Cap({ children, style }) {
  return <Txt style={[{ fontSize: 12.5, color: C.ink3 }, style]}>{children}</Txt>;
}

// ---------- ConsentBadges ----------
export function ConsentBadges({ client, compact }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
      <Tag variant={client.consentClinical ? 'ok' : 'danger'} icon="shield">{compact ? 'Clinical' : 'Clinical archive'}</Tag>
      <Tag variant={client.consentSocial ? 'ok' : 'miss'} icon={client.consentSocial ? 'share' : 'eyeoff'}>{compact ? 'Social' : 'Social use'}</Tag>
    </View>
  );
}

// ---------- Sheet (bottom modal) ----------
export function Sheet({ open, onClose, title, children, maxH }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable onPress={onClose} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20,28,38,0.34)' }]} />
        <View
          style={{
            backgroundColor: C.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24,
            paddingHorizontal: PAD, paddingTop: 10, paddingBottom: 18 + Math.max(insets.bottom, 4),
            maxHeight: maxH || '80%', ...shadowPop,
          }}
        >
          <View style={{ width: 38, height: 5, borderRadius: 99, backgroundColor: C.line2, alignSelf: 'center', marginTop: 2, marginBottom: 14 }} />
          {title && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Txt style={{ fontWeight: '700', fontSize: 18 }}>{title}</Txt>
              <IconBtn name="x" size={20} bare onPress={onClose} />
            </View>
          )}
          {children}
        </View>
      </View>
    </Modal>
  );
}

// ---------- Toast ----------
export function Toast({ msg }) {
  const insets = useSafeAreaInsets();
  if (!msg) return null;
  return (
    <View pointerEvents="none" style={[s.toastWrap, { bottom: 20 + Math.max(insets.bottom, 4) }]}>
      <View style={s.toast}>
        <Icon name="check" size={16} color="#7ee0b4" />
        <Txt style={{ color: '#fff', fontSize: 13.5, fontWeight: '600' }}>{msg}</Txt>
      </View>
    </View>
  );
}

// ---------- Slider (thin custom track, used for camera overlay opacity) ----------
export function Slider({ value, onChange, min = 0, max = 1, trackColor = 'rgba(255,255,255,0.25)', fillColor = '#3b82f6', style }) {
  const [w, setW] = React.useState(0);
  const wRef = React.useRef(0);
  const valRef = React.useRef(value);
  valRef.current = value;
  const pan = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => set(e.nativeEvent.locationX),
      onPanResponderMove: (e) => set(e.nativeEvent.locationX),
    })
  ).current;
  function set(x) {
    if (!wRef.current) return;
    const ratio = Math.max(0, Math.min(1, x / wRef.current));
    onChange(min + ratio * (max - min));
  }
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <View
      {...pan.panHandlers}
      onLayout={(e) => { wRef.current = e.nativeEvent.layout.width; setW(e.nativeEvent.layout.width); }}
      style={[{ height: 28, justifyContent: 'center' }, style]}
    >
      <View style={{ height: 4, borderRadius: 99, backgroundColor: trackColor, overflow: 'hidden' }}>
        <View style={{ height: 4, width: `${pct}%`, backgroundColor: fillColor }} />
      </View>
      <View style={{ position: 'absolute', left: Math.max(0, (pct / 100) * w - 8), width: 16, height: 16, borderRadius: 99, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 3 }} />
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: R },
  iconbtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  btn: { borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 7, alignSelf: 'flex-start' },
  switch: { width: 46, height: 28, borderRadius: 99, backgroundColor: C.surface3, borderWidth: 1, borderColor: C.line2, justifyContent: 'center' },
  knob: { position: 'absolute', top: 1, width: 22, height: 22, borderRadius: 99, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  seg: { flexDirection: 'row', gap: 3, padding: 3, backgroundColor: C.surface2, borderRadius: 13, borderWidth: 1, borderColor: C.line },
  segBtn: { flex: 1, paddingVertical: 9, paddingHorizontal: 6, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segBtnOn: { backgroundColor: C.surface, shadowColor: '#1c2530', shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: PAD, paddingVertical: 10, minHeight: 52 },
  input: { borderWidth: 1, borderColor: C.line2, backgroundColor: C.surface, borderRadius: 13, paddingVertical: 13, paddingHorizontal: 14, fontSize: 15, color: C.ink, fontFamily: 'HankenGrotesk_400Regular' },
  toastWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 90 },
  toast: { backgroundColor: C.ink, paddingVertical: 11, paddingHorizontal: 18, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 9, ...shadowPop },
});
