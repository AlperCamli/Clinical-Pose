// Screen scaffold — paper background, top safe-area inset (custom TopBar sits below status bar).
import React from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C } from '../theme';

export function Screen({ children, dark, style }) {
  return (
    <SafeAreaView edges={['top']} style={[{ flex: 1, backgroundColor: dark ? '#0c0f14' : C.paper }, style]}>
      {children}
    </SafeAreaView>
  );
}

// Scrollable body (mirrors .scrollbody)
export function ScrollBody({ children, style, contentStyle, ...rest }) {
  return (
    <ScrollView
      style={[{ flex: 1 }, style]}
      contentContainerStyle={contentStyle}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      {...rest}
    >
      {children}
    </ScrollView>
  );
}

export function Spread({ children, style }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, style]}>{children}</View>;
}
