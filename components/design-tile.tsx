import { Pressable, StyleSheet, Text, useWindowDimensions } from 'react-native';

import { DesignPhoto } from '@/components/design-photo';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { formatCurrency } from '@/lib/format';
import { Design } from '@/lib/types';

// Two per row, photo-forward — sized off the screen instead of a fixed
// thumbnail width, so this reads as a lookbook rather than a parts list.
// Matches the catalogue screen's own padding (Spacing.md each side) and
// inter-tile gap (Spacing.md) in app/(app)/catalogues/[id].tsx. Tapping the
// photo opens the full-screen DesignGalleryViewer at this design.
export function DesignTile({ design, onPress }: { design: Design; onPress?: () => void }) {
  const { width: screenWidth } = useWindowDimensions();
  const tileWidth = (screenWidth - Spacing.md * 2 - Spacing.md) / 2;

  return (
    <Pressable
      style={({ pressed }) => [styles.tile, { width: tileWidth }, pressed && onPress && styles.tilePressed]}
      onPress={onPress}
      disabled={!onPress}>
      <DesignPhoto url={design.photo_url} size={tileWidth} />
      <Text style={styles.name} numberOfLines={1}>
        {design.name}
      </Text>
      <Text style={styles.price}>{formatCurrency(design.selling_price)}</Text>
      {design.discount_price ? (
        <Text style={styles.discountPrice}>Bulk {formatCurrency(design.discount_price)}</Text>
      ) : null}
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
  name: {
    fontSize: 13,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  price: {
    fontSize: 13,
    fontWeight: Typography.weightRegular,
    color: Colors.textSecondary,
  },
  discountPrice: {
    fontSize: 12,
    fontWeight: Typography.weightMedium,
    color: Colors.accent,
  },
});
