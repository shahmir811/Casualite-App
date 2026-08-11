import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { SizeBreakdown } from '@/lib/types';

const SIZES: { key: keyof SizeBreakdown; label: string }[] = [
  { key: 'xs', label: 'XS' },
  { key: 's', label: 'S' },
  { key: 'm', label: 'M' },
  { key: 'l', label: 'L' },
  { key: 'xl', label: 'XL' },
];

export function SizeBreakdownRow({ breakdown }: { breakdown: SizeBreakdown }) {
  return (
    <View style={styles.row}>
      {SIZES.map(({ key, label }) => (
        <View key={key} style={styles.cell}>
          <Text style={styles.value}>{breakdown[key]}</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  value: {
    fontSize: 17,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
  },
  label: {
    fontSize: 12,
    fontWeight: Typography.weightMedium,
    color: Colors.textTertiary,
  },
});
