// ============ NATURE — social post wizard shell ============
import React from 'react';
import { View } from 'react-native';
import { Screen, ScrollBody } from './Screen';
import { TopBar, Steps, Tag } from './ui';
import { PAD } from '../theme';
import { useNav } from '../store';

export default function Wizard({ step, total = 3, title, sub, onBack, children, footer }) {
  const nav = useNav();
  const showSteps = step != null;
  return (
    <Screen>
      <TopBar onBack={onBack || nav.back} title={title} sub={sub} border right={showSteps ? <Tag variant="accent">{`${step + 1}/${total}`}</Tag> : undefined} />
      {showSteps && (
        <View style={{ paddingHorizontal: PAD, paddingTop: 12, paddingBottom: 2 }}>
          <Steps n={total} cur={step} />
        </View>
      )}
      <ScrollBody contentStyle={{ paddingHorizontal: PAD, paddingTop: 14, paddingBottom: 8 }}>{children}</ScrollBody>
      {footer}
    </Screen>
  );
}
