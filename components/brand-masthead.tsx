import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '@/constants/theme';

// The black band + tracked wordmark from the brand's own logo card
// (casualite-logo.png / the owner's black-card social treatment) — a
// contained, full-bleed quote of that mark, not a dark theme. Everything
// below it stays on the light background per constants/theme.ts.
export function BrandMasthead({ left, right }: { left?: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.band}>
      <View style={styles.side}>{left}</View>
      <Text style={styles.wordmark}>CASUALITE</Text>
      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    backgroundColor: Colors.brandBlack,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  side: {
    flex: 1,
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  wordmark: {
    flex: 2,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: Typography.weightSemibold,
    letterSpacing: 5,
  },
});
