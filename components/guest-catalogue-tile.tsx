import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignPhoto } from '@/components/design-photo';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { PublicCatalogueSummary } from '@/lib/types';

const PHOTO_WIDTH = 104;
const PHOTO_HEIGHT = 136;

// Pre-login counterpart to CatalogueTile — same layout, minus the
// already_ordered badge, which is meaningless without a known customer.
export function GuestCatalogueTile({
  catalogue,
  onPress,
}: {
  catalogue: PublicCatalogueSummary;
  onPress: () => void;
}) {
  const closed = catalogue.status === 'closed';
  const disabled = closed || catalogue.sold_out;

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
        {disabled ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Sold Out</Text>
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
    backgroundColor: Colors.divider,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: Typography.weightSemibold,
    color: Colors.textTertiary,
  },
});
