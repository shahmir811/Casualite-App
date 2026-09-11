import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignPhoto } from '@/components/design-photo';
import { Colors, Radius, Spacing, StatusColors, Typography } from '@/constants/theme';
import { CatalogueSummary } from '@/lib/types';

const PHOTO_WIDTH = 104;
const PHOTO_HEIGHT = 136;

// One full-width row per catalogue — cover photo left, name/meta and a
// circular action affordance right — per the owner's 2026-09-11 design
// feedback. Sizes are always the fixed xs–xl enum (CLAUDE.md §6), so "XS to
// XL" is safe to show as a static string rather than derived data.
export function CatalogueTile({ catalogue, onPress }: { catalogue: CatalogueSummary; onPress: () => void }) {
  const disabled = catalogue.sold_out || catalogue.already_ordered;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && !disabled && styles.cardPressed, disabled && styles.cardDisabled]}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}>
      <DesignPhoto url={catalogue.cover_photo_url} size={PHOTO_WIDTH} height={PHOTO_HEIGHT} />
      <View style={styles.body}>
        <View>
          <Text style={styles.name} numberOfLines={1}>
            {catalogue.name}
          </Text>
          <Text style={styles.meta}>
            {catalogue.number_of_designs} {catalogue.number_of_designs === 1 ? 'Design' : 'Designs'} · XS to XL
          </Text>
        </View>
        {catalogue.sold_out ? (
          <View style={[styles.badge, styles.soldOutBadge]}>
            <Text style={[styles.badgeText, styles.soldOutText]}>Sold Out</Text>
          </View>
        ) : catalogue.already_ordered ? (
          <View style={[styles.badge, styles.orderedBadge]}>
            <Text style={[styles.badgeText, styles.orderedText]}>Already Ordered</Text>
          </View>
        ) : (
          <View style={styles.arrowButton}>
            <Ionicons name="arrow-forward" size={18} color={Colors.textPrimary} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
  },
  cardPressed: {
    opacity: 0.7,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  body: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    paddingRight: Spacing.xs,
  },
  name: {
    fontSize: 18,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
  },
  meta: {
    fontSize: 13,
    fontWeight: Typography.weightRegular,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  arrowButton: {
    alignSelf: 'flex-end',
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfacePressed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    alignSelf: 'flex-end',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: Typography.weightSemibold,
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
