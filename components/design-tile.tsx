import { StyleSheet, Text, View } from 'react-native';

import { DesignPhoto } from '@/components/design-photo';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { formatCurrency } from '@/lib/format';
import { Design } from '@/lib/types';

export function DesignTile({ design }: { design: Design }) {
  return (
    <View style={styles.tile}>
      <DesignPhoto url={design.photo_url} size={104} />
      <Text style={styles.name} numberOfLines={1}>
        {design.name}
      </Text>
      <Text style={styles.price}>{formatCurrency(design.selling_price)}</Text>
      {design.discount_price ? (
        <Text style={styles.discountPrice}>Bulk {formatCurrency(design.discount_price)}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 104,
    gap: 2,
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
    color: Colors.success,
  },
});
