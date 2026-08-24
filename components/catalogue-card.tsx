import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignPhoto } from '@/components/design-photo';
import { Colors, Radius, Spacing, StatusColors, Typography } from '@/constants/theme';
import { CatalogueSummary } from '@/lib/types';

export function CatalogueCard({ catalogue, onPress }: { catalogue: CatalogueSummary; onPress: () => void }) {
  // already_ordered hard-blocks a second order server-side, so treat it the
  // same as sold_out here — no point opening the detail screen just to hit
  // duplicate_order on submit.
  const disabled = catalogue.sold_out || catalogue.already_ordered;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, disabled && styles.cardDisabled, pressed && !disabled && styles.cardPressed]}
      onPress={disabled ? undefined : onPress}>
      <DesignPhoto url={catalogue.cover_photo_url} size={80} />
      <View style={styles.info}>
        <Text style={styles.name}>{catalogue.name}</Text>
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
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  cardPressed: {
    backgroundColor: Colors.surfacePressed,
  },
  cardDisabled: {
    opacity: 0.7,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 17,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
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
