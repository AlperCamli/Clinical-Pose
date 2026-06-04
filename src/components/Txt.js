// Text wrapper that resolves the correct Google-font family from fontWeight.
// RN won't pick a weight variant from a custom family automatically, so we map it.
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { fontFamily, C, FZ } from '../theme';

export default function Txt({ style, mono = false, children, ...rest }) {
  const flat = StyleSheet.flatten(style) || {};
  const weight = flat.fontWeight || '400';
  const resolved = {
    color: C.ink,
    fontSize: FZ,
    ...flat,
    fontFamily: fontFamily(weight, mono || flat.fontFamily === 'mono'),
  };
  // fontWeight must be removed — the family already encodes weight.
  delete resolved.fontWeight;
  return (
    <Text style={resolved} {...rest}>
      {children}
    </Text>
  );
}
