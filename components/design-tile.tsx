import { Pressable, StyleSheet, Text, useWindowDimensions } from 'react-native';

import { DesignPhoto } from '@/components/design-photo';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { formatCurrency } from '@/lib/format';
import { Design } from '@/lib/types';

// Three per row, photo-forward — sized off the screen instead of a fixed
// thumbnail width, so this reads as a lookbook rather than a parts list.
// Matches the catalogue screen's own padding (Spacing.md each side) and
// inter-tile gap (Spacing.md) in app/(app)/catalogues/[id].tsx. Tapping the
// photo opens the full-screen DesignGalleryViewer at this design.
export function DesignTile({ design, index, onPress }: { design: Design; index?: number; onPress?: () => void }) {
  const { width: screenWidth } = useWindowDimensions();
  // Floored rather than divided evenly — an exact-fit width leaves flex-wrap
  // zero slack, so sub-pixel rounding on some screen widths tips the 3rd
  // tile onto its own row and collapses the grid to two columns.
  const tileWidth = Math.floor((screenWidth - Spacing.md * 2 - Spacing.md * 2) / 3);
  const number = index != null ? String(index + 1).padStart(2, '0') : null;

  return (
    <Pressable
      style={({ pressed }) => [styles.tile, { width: tileWidth }, pressed && onPress && styles.tilePressed]}
      onPress={onPress}
      disabled={!onPress}>
      <DesignPhoto url={design.photo_url} size={tileWidth} />
      <Text style={styles.name} numberOfLines={1}>
        {number != null ? `${number} ${design.name}` : design.name}
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
