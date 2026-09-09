import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { DesignPhoto } from '@/components/design-photo';
import { Colors, Radius, Spacing, StatusColors, Typography } from '@/constants/theme';
import { CatalogueSummary } from '@/lib/types';

// Two per row, photo-forward — same responsive sizing as components/
// design-tile.tsx, so browsing catalogues reads as the same lookbook as
// browsing designs inside one, now that real cover photography exists.
export function CatalogueTile({ catalogue, onPress }: { catalogue: CatalogueSummary; onPress: () => void }) {
  const { width: screenWidth } = useWindowDimensions();
  const tileWidth = (screenWidth - Spacing.md * 2 - Spacing.md) / 2;

  // already_ordered hard-blocks a second order server-side, so treat it the
  // same as sold_out here — no point opening the detail screen just to hit
  // duplicate_order on submit.
  const disabled = catalogue.sold_out || catalogue.already_ordered;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.tile,
        { width: tileWidth },
        disabled && styles.tileDisabled,
        pressed && !disabled && styles.tilePressed,
      ]}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}>
      <DesignPhoto url={catalogue.cover_photo_url} size={tileWidth} />
      <Text style={styles.name} numberOfLines={1}>
        {catalogue.name}
      </Text>
      <Text style={styles.meta}>
        {catalogue.number_of_designs} {catalogue.number_of_designs === 1 ? 'design' : 'designs'}
      </Text>
      {catalogue.sold_out ? (
        <View style={[styles.badge, styles.soldOutBadge]}>
          <Text style={[styles.badgeText, styles.soldOutText]}>Sold Out</Text>
        </View>
      ) : catalogue.already_ordered ? (
        <View style={[styles.badge, styles.orderedBadge]}>
          <Text style={[styles.badgeText, styles.orderedText]}>Already Ordered</Text>
        </View>
      ) : (
        <View style={[styles.badge, styles.orderBadge]}>
          <Text style={[styles.badgeText, styles.orderText]}>Order Now</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    gap: 2,
  },
  tilePressed: {
    opacity: 0.7,
  },
  tileDisabled: {
    opacity: 0.6,
  },
  name: {
    fontSize: 14,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  meta: {
    fontSize: 13,
    fontWeight: Typography.weightRegular,
    color: Colors.textSecondary,
  },
  badge: {
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: Typography.weightSemibold,
  },
  orderBadge: {
    backgroundColor: Colors.accent,
  },
  orderText: {
    color: Colors.surface,
  },
  orderedBadge: {
    backgroundColor: StatusColors.dispatched.bg,
  },
  orderedText: {
    color: StatusColors.dispatched.text,
  },
  soldOutBadge: {
    backgroundColor: Colors.divider,
  },
  soldOutText: {
    color: Colors.textTertiary,
  },
});
