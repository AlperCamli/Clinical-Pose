// ============ NATURE — treatment glyphs (abstract marks, not faces) ============
import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { C } from '../theme';

export default function TGlyph({ tid, size = 22, color = C.accentInk }) {
  const s = { fill: 'none', stroke: color, strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {tid === 'lip' && [
        <Path key="a" d="M3 12c2-2 5-3 9-3s7 1 9 3c-2 2-5 3.5-9 3.5S5 14 3 12Z" {...s} />,
        <Path key="b" d="M3 12h18" {...s} />,
      ]}
      {tid === 'botox' && [<Path key="a" d="M4 9c3-2 13-2 16 0M5 13c3 1 11 1 14 0" {...s} />]}
      {tid === 'nose' && [<Path key="a" d="M12 4c-1 4-3 7-3 10a3 3 0 0 0 6 0c0-3-2-6-3-10Z" {...s} />]}
      {tid === 'jaw' && [<Path key="a" d="M5 5v5c0 5 3 9 7 9s7-4 7-9V5" {...s} />]}
      {tid === 'eye' && [
        <Path key="a" d="M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5Z" {...s} />,
        <Circle key="b" cx={12} cy={12} r={2.4} {...s} />,
      ]}
      {tid === 'skin' && [
        <Circle key="a" cx={12} cy={12} r={8} {...s} />,
        <Circle key="b" cx={9} cy={10} r={1} {...s} />,
        <Circle key="c" cx={14} cy={13} r={1} {...s} />,
        <Circle key="d" cx={13} cy={8.5} r={1} {...s} />,
      ]}
      {tid === 'hair' && [<Path key="a" d="M4 13c0-5 3.5-9 8-9s8 4 8 9M6 13c2-3 10-3 12 0" {...s} />]}
      {tid === 'custom' && [<Path key="a" d="M12 5v14M5 12h14" {...s} />]}
    </Svg>
  );
}
