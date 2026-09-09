import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, DimensionValue, StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

// A single pulsing placeholder box. Checks the OS reduce-motion setting once
// on mount rather than animating unconditionally — a static gray box still
// reads as "loading" without the motion.
export function Skeleton({
  width,
  height,
  radius = Radius.chip,
  style,
}: {
  width: DimensionValue;
  height: DimensionValue;
  radius?: number;
  style?: ViewStyle;
}) {
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    let cancelled = false;
    let loop: Animated.CompositeAnimation | undefined;

    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (cancelled || reduced) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.55, duration: 700, useNativeDriver: true }),
        ])
      );
      loop.start();
    });

    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [opacity]);

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: Colors.divider, opacity }, style]}
    />
  );
}

// Mirrors components/catalogue-tile.tsx: same responsive two-column square
// photo as DesignTileSkeleton, plus a name line, meta line, and a pill.
export function CatalogueTileSkeleton() {
  const { width: screenWidth } = useWindowDimensions();
  const tileWidth = (screenWidth - Spacing.md * 2 - Spacing.md) / 2;

  return (
    <View style={{ width: tileWidth, gap: 6 }}>
      <Skeleton width={tileWidth} height={tileWidth} radius={Radius.chip} />
      <Skeleton width="75%" height={14} radius={4} />
      <Skeleton width="45%" height={13} radius={4} />
      <Skeleton width={72} height={20} radius={Radius.pill} />
    </View>
  );
}

// Mirrors components/order-card.tsx: status pill + date, catalogue name,
// pieces line, amount + paid/due row.
export function OrderCardSkeleton() {
  return (
    <View style={styles.orderCard}>
      <View style={styles.orderTopRow}>
        <Skeleton width={92} height={20} radius={Radius.pill} />
        <Skeleton width={64} height={13} radius={4} />
      </View>
      <Skeleton width="55%" height={17} radius={4} style={styles.gapTop} />
      <Skeleton width="40%" height={14} radius={4} style={styles.gapSmTop} />
      <View style={[styles.orderTopRow, styles.gapTop]}>
        <Skeleton width={80} height={16} radius={4} />
        <Skeleton width={54} height={14} radius={4} />
      </View>
    </View>
  );
}

// Mirrors components/announcement-card.tsx: unread-dot gutter, title + time
// row, two lines of body.
export function AnnouncementRowSkeleton() {
  return (
    <View style={styles.announcementRow}>
      <View style={styles.announcementDotSpacer} />
      <View style={styles.announcementContent}>
        <View style={styles.orderTopRow}>
          <Skeleton width="55%" height={16} radius={4} />
          <Skeleton width={28} height={12} radius={4} />
        </View>
        <Skeleton width="92%" height={13} radius={4} />
        <Skeleton width="70%" height={13} radius={4} />
      </View>
    </View>
  );
}

// Mirrors components/design-tile.tsx: square photo, name line, price line —
// same responsive two-column width so the grid doesn't jump on load.
export function DesignTileSkeleton() {
  const { width: screenWidth } = useWindowDimensions();
  const tileWidth = (screenWidth - Spacing.md * 2 - Spacing.md) / 2;

  return (
    <View style={{ width: tileWidth, gap: 6 }}>
      <Skeleton width={tileWidth} height={tileWidth} radius={Radius.chip} />
      <Skeleton width="70%" height={13} radius={4} />
      <Skeleton width="40%" height={13} radius={4} />
    </View>
  );
}

// Mirrors the ledger screen's row: title + subtitle on the left, amount on
// the right.
export function LedgerRowSkeleton() {
  return (
    <View style={styles.ledgerRow}>
      <View style={{ gap: 6 }}>
        <Skeleton width={150} height={15} radius={4} />
        <Skeleton width={96} height={12} radius={4} />
      </View>
      <Skeleton width={70} height={15} radius={4} />
    </View>
  );
}

const styles = StyleSheet.create({
  gapTop: {
    marginTop: 8,
  },
  gapSmTop: {
    marginTop: 6,
  },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  orderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  announcementRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
  },
  announcementDotSpacer: {
    width: 8,
  },
  announcementContent: {
    flex: 1,
    gap: 6,
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
});
