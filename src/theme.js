// ============ NATURE — design tokens (ported from Nature.html :root) ============
// Locked to the chosen defaults: roundness=soft, density=regular, eyeStyle=blur.

export const C = {
  bg:        '#eef1f4',
  paper:     '#f6f8fa',
  surface:   '#ffffff',
  surface2:  '#f0f3f7',
  surface3:  '#e9edf3',
  ink:       '#1c2530',
  ink2:      '#586577',
  ink3:      '#93a0b0',
  line:      '#e4e9f0',
  line2:     '#d3dae4',

  accent:     '#2563eb',
  accentInk:  '#1b4fd1',
  accentPress:'#1742b8',
  accentWash: '#eaf1ff',
  accentWash2:'#dbe8ff',

  ok:    '#109b6a', okWash:'#e3f6ee',
  warn:  '#d4880b', warnWash:'#fbf0d9',
  miss:  '#98a3b3', missWash:'#eef1f5',
  danger:'#d4503c', dangerWash:'#fbe9e6',
};

// roundness=soft → [18,12,26]
export const R    = 18;
export const R_SM = 12;
export const R_LG = 26;

// density=regular → pad/gap/fz
export const PAD = 20;
export const GAP = 16;
export const FZ  = 15;

// shadows (approximation of the layered CSS shadows)
export const shadowCard = {
  shadowColor: '#1c2530', shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.1, shadowRadius: 12, elevation: 3,
};
export const shadowPop = {
  shadowColor: '#1c2530', shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.26, shadowRadius: 26, elevation: 14,
};
export const shadowBtn = {
  shadowColor: '#2563eb', shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.45, shadowRadius: 14, elevation: 6,
};

// ---- font family resolution ----
// RN requires the exact weight-variant family name; fontWeight alone won't pick it.
const HANKEN = {
  400: 'HankenGrotesk_400Regular',
  500: 'HankenGrotesk_500Medium',
  600: 'HankenGrotesk_600SemiBold',
  700: 'HankenGrotesk_700Bold',
  800: 'HankenGrotesk_800ExtraBold',
};
const MONO = {
  400: 'GeistMono_400Regular',
  500: 'GeistMono_500Medium',
  600: 'GeistMono_600SemiBold',
};

function nearestWeight(table, w) {
  const keys = Object.keys(table).map(Number);
  const n = Number(w) || 400;
  return keys.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a), keys[0]);
}

export function fontFamily(weight = 400, mono = false) {
  const table = mono ? MONO : HANKEN;
  return table[nearestWeight(table, weight)];
}
