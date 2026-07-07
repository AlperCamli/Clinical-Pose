// ============ NATURE — stroke icon set (ported to react-native-svg) ============
import React from 'react';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

const ICONS = {
  search:   (s) => [<Circle key="a" cx={11} cy={11} r={7} {...s} />, <Path key="b" d="m21 21-4.3-4.3" {...s} />],
  plus:     (s) => [<Path key="a" d="M12 5v14M5 12h14" {...s} />],
  chevR:    (s) => [<Path key="a" d="m9 6 6 6-6 6" {...s} />],
  chevL:    (s) => [<Path key="a" d="m15 6-6 6 6 6" {...s} />],
  chevDown: (s) => [<Path key="a" d="m6 9 6 6 6-6" {...s} />],
  back:     (s) => [<Path key="a" d="m15 6-6 6 6 6" {...s} />],
  x:        (s) => [<Path key="a" d="M18 6 6 18M6 6l12 12" {...s} />],
  check:    (s) => [<Path key="a" d="M20 6 9 17l-5-5" {...s} />],
  camera:   (s) => [<Path key="a" d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" {...s} />, <Circle key="b" cx={12} cy={12.5} r={3.4} {...s} />],
  user:     (s) => [<Circle key="a" cx={12} cy={8} r={4} {...s} />, <Path key="b" d="M4 20c0-3.6 3.6-6 8-6s8 2.4 8 6" {...s} />],
  users:    (s) => [<Circle key="a" cx={9} cy={8} r={3.4} {...s} />, <Path key="b" d="M2.5 19c0-3 2.9-5 6.5-5s6.5 2 6.5 5" {...s} />, <Path key="c" d="M16 5.2A3.4 3.4 0 0 1 16 12M21.5 19c0-2.3-1.6-4-4-4.6" {...s} />],
  clock:    (s) => [<Circle key="a" cx={12} cy={12} r={9} {...s} />, <Path key="b" d="M12 7v5l3 2" {...s} />],
  layers:   (s) => [<Path key="a" d="m12 3 9 5-9 5-9-5 9-5Z" {...s} />, <Path key="b" d="m3 13 9 5 9-5" {...s} />],
  image:    (s) => [<Rect key="a" x={3} y={4} width={18} height={16} rx={2.5} {...s} />, <Circle key="b" cx={9} cy={10} r={2} {...s} />, <Path key="c" d="m4 18 5-4 4 3 3-2 4 3" {...s} />],
  share:    (s) => [<Circle key="a" cx={18} cy={5} r={3} {...s} />, <Circle key="b" cx={6} cy={12} r={3} {...s} />, <Circle key="c" cx={18} cy={19} r={3} {...s} />, <Path key="d" d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5" {...s} />],
  eye:      (s) => [<Path key="a" d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" {...s} />, <Circle key="b" cx={12} cy={12} r={3} {...s} />],
  eyeoff:   (s) => [<Path key="a" d="M3 3l18 18" {...s} />, <Path key="b" d="M10.6 6.2A9.6 9.6 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.3 4M6.3 7.7A17 17 0 0 0 2 12s3.6 7 10 7a9.4 9.4 0 0 0 4-.9" {...s} />, <Path key="c" d="M9.5 10.4a3 3 0 0 0 4.2 4.2" {...s} />],
  settings: (s) => [<Circle key="a" cx={12} cy={12} r={3} {...s} />, <Path key="b" d="M19.4 14a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7.7 1.6 1.6 0 0 0-1.6 1.3H12a2 2 0 0 1-4 0 1.6 1.6 0 0 0-1.6-1.3 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .4-1.8 1.6 1.6 0 0 0-1.5-1H4a2 2 0 0 1 0-4 1.6 1.6 0 0 0 1.3-2.3 1.6 1.6 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7.4 4.3l.1.1a1.6 1.6 0 0 0 2.3-.4 1.6 1.6 0 0 0 1-1.5V2a2 2 0 0 1 4 0 1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V8a1.6 1.6 0 0 0 1.5 1H22a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" {...s} />],
  cloud:    (s) => [<Path key="a" d="M7 18a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.6-1.3A4 4 0 0 1 17 18Z" {...s} />, <Path key="b" d="M12 21v-7m0 0-2.2 2.2M12 14l2.2 2.2" {...s} />],
  bolt:     (s) => [<Path key="a" d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" {...s} />],
  grid:     (s) => [<Rect key="a" x={3} y={3} width={7} height={7} rx={1.5} {...s} />, <Rect key="b" x={14} y={3} width={7} height={7} rx={1.5} {...s} />, <Rect key="c" x={3} y={14} width={7} height={7} rx={1.5} {...s} />, <Rect key="d" x={14} y={14} width={7} height={7} rx={1.5} {...s} />],
  slider:   (s) => [<Path key="a" d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" {...s} />, <Circle key="b" cx={4} cy={12} r={2} {...s} />, <Circle key="c" cx={12} cy={6} r={2} {...s} />, <Circle key="d" cx={20} cy={14} r={2} {...s} />],
  sparkle:  (s) => [<Path key="a" d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.4 2.4M15.3 15.3l2.4 2.4M17.7 6.3l-2.4 2.4M8.7 15.3l-2.4 2.4" {...s} />],
  flip:     (s) => [<Path key="a" d="M12 3v18" {...s} />, <Path key="b" d="M7 8 4 11l3 3M17 8l3 3-3 3" {...s} />],
  shield:   (s) => [<Path key="a" d="M12 3 5 6v6c0 4 3 7 7 8 4-1 7-4 7-8V6l-7-3Z" {...s} />, <Path key="b" d="m9 12 2 2 4-4" {...s} />],
  dot:      (s) => [<Circle key="a" cx={12} cy={12} r={9} {...s} />],
  retake:   (s) => [<Path key="a" d="M3 12a9 9 0 1 0 3-6.7L3 8" {...s} />, <Path key="b" d="M3 4v4h4" {...s} />],
  note:     (s) => [<Path key="a" d="M5 4h14v16l-3-2-2 2-2-2-2 2-2-2-3 2Z" {...s} />, <Path key="b" d="M9 9h6M9 13h4" {...s} />],
  phone:    (s) => [<Path key="a" d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" {...s} />],
  calendar: (s) => [<Rect key="a" x={3} y={5} width={18} height={16} rx={2.5} {...s} />, <Path key="b" d="M3 9h18M8 3v4M16 3v4" {...s} />],
  align:    (s) => [<Rect key="a" x={4} y={4} width={16} height={16} rx={2} {...s} />, <Path key="b" d="M12 4v16M4 12h16" {...s} />],
  home:     (s) => [<Path key="a" d="M4 11 12 4l8 7" {...s} />, <Path key="b" d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" {...s} />],
  bell:     (s) => [<Path key="a" d="M6 9a6 6 0 0 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9Z" {...s} />, <Path key="b" d="M10 19.5a2.2 2.2 0 0 0 4 0" {...s} />],
  message:  (s) => [<Path key="a" d="M21 12a8 8 0 0 1-8 8H4l1.6-3.2A8 8 0 1 1 21 12Z" {...s} />, <Path key="b" d="M8.5 10.5h7M8.5 14h4.5" {...s} />],
  video:    (s) => [<Rect key="a" x={3} y={6} width={13} height={12} rx={2.5} {...s} />, <Path key="b" d="m16 10.5 5-3v9l-5-3" {...s} />],
  tv:       (s) => [<Rect key="a" x={3} y={5} width={18} height={13} rx={2.5} {...s} />, <Path key="b" d="M8 21h8" {...s} />],
  play:     (s) => [<Path key="a" d="M8 5.5v13l11-6.5-11-6.5Z" {...s} />],
  pause:    (s) => [<Path key="a" d="M8 5v14M16 5v14" {...s} />],
  send:     (s) => [<Path key="a" d="M21 3 10.5 13.5" {...s} />, <Path key="b" d="M21 3 14 21l-3.5-7.5L3 10l18-7Z" {...s} />],
  trash:    (s) => [<Path key="a" d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" {...s} />, <Path key="b" d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" {...s} />, <Path key="c" d="M10 11v6M14 11v6" {...s} />],
};

export default function Icon({ name, size = 20, stroke = 2, color = '#1c2530', style }) {
  const shared = {
    fill: 'none',
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };
  const render = ICONS[name] || ICONS.dot;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <G>{render(shared)}</G>
    </Svg>
  );
}
