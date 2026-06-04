// ============ NATURE — social post wizard shell ============
import React from 'react';
import { View } from 'react-native';
import { Screen, ScrollBody } from './Screen';
import { TopBar, Steps, Tag } from './ui';
import { PAD } from '../theme';
import { useNav } from '../store';

export default function Wizard({ step, title, sub, onBack, children, footer }) {
  const nav = useNav();
  return (
    <Screen>
      <TopBar onBack={onBack || nav.back} title={title} sub={sub} border right={<Tag variant="accent">{`${step + 1}/4`}</Tag>} />
      <View style={{ paddingHorizontal: PAD, paddingTop: 12, paddingBottom: 2 }}>
        <Steps n={4} cur={step} />
      </View>
      <ScrollBody contentStyle={{ paddingHorizontal: PAD, paddingTop: 14, paddingBottom: 8 }}>{children}</ScrollBody>
      {footer}
    </Screen>
  );
}
