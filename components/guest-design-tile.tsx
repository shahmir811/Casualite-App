import { Pressable, StyleSheet, Text, useWindowDimensions } from 'react-native';

import { DesignPhoto } from '@/components/design-photo';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { PublicDesign } from '@/lib/types';

// Pre-login counterpart to DesignTile — same three-per-row grid, no price
// line (pricing stays a sign-in perk, see CatalogueController::publicShow).
export function GuestDesignTile({ design, index }: { design: PublicDesign; index?: number }) {
  const { width: screenWidth } = useWindowDimensions();
  const tileWidth = Math.floor((screenWidth - Spacing.md * 2 - Spacing.md * 2) / 3);
  const number = index != null ? String(index + 1).padStart(2, '0') : null;

  return (
    <Pressable style={[styles.tile, { width: tileWidth }]} disabled>
      <DesignPhoto url={design.photo_url} size={tileWidth} />
      <Text style={styles.name} numberOfLines={1}>
        {number != null ? `${number} ${design.name}` : design.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    gap: 2,
  },
  name: {
    fontSize: 13,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
});
