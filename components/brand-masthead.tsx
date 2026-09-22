import { Image } from 'expo-image';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';

const LOGO_ASPECT_RATIO = 900 / 632;

// The black band + the brand's own logo mark (casualite-logo.png), tinted
// white for this dark band — a contained, full-bleed quote of the mark the
// owner already uses on black-card social posts, not a dark theme. The
// source PNG is black-on-transparent, so tintColor recolors it cleanly.
// Everything below the band stays on the light background per constants/theme.ts.
export function BrandMasthead({ left, right }: { left?: ReactNode; right?: ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.band, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={styles.side}>{left}</View>
      <View style={styles.logoWrap}>
        <Image
          source={require('@/assets/images/casualite-logo.png')}
          style={styles.logo}
          contentFit="contain"
          tintColor="#FFFFFF"
        />
      </View>
      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    backgroundColor: Colors.brandBlack,
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  side: {
    flex: 1,
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  logoWrap: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    height: 30,
    aspectRatio: LOGO_ASPECT_RATIO,
  },
});
