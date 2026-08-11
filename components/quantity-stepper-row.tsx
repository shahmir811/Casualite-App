import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { SizeBreakdown } from '@/lib/types';

const SIZES: { key: keyof SizeBreakdown; label: string }[] = [
  { key: 'xs', label: 'XS' },
  { key: 's', label: 'S' },
  { key: 'm', label: 'M' },
  { key: 'l', label: 'L' },
  { key: 'xl', label: 'XL' },
];

// One set of quantities for the whole catalogue, applied to every design in
// it — not a per-design picker. See CLAUDE.md §4.
export function QuantityStepperRow({
  sizes,
  onChange,
}: {
  sizes: SizeBreakdown;
  onChange: (size: keyof SizeBreakdown, value: number) => void;
}) {
  return (
    <View style={styles.row}>
      {SIZES.map(({ key, label }) => {
        const value = sizes[key];
        return (
          <View key={key} style={styles.column}>
            <Text style={styles.label}>{label}</Text>
            <Pressable
              style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}
              onPress={() => onChange(key, value + 1)}
              hitSlop={6}>
              <Ionicons name="add" size={16} color={Colors.accent} />
            </Pressable>
            <Text style={styles.count}>{value}</Text>
            <Pressable
              style={({ pressed }) => [
                styles.stepButton,
                value === 0 && styles.stepButtonDisabled,
                pressed && value > 0 && styles.stepButtonPressed,
              ]}
              onPress={() => onChange(key, Math.max(0, value - 1))}
              disabled={value === 0}
              hitSlop={6}>
              <Ionicons name="remove" size={16} color={value === 0 ? Colors.textTertiary : Colors.accent} />
            </Pressable>
          </View>
        );
      })}
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
    paddingVertical: Spacing.md,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: Typography.weightSemibold,
    color: Colors.textTertiary,
  },
  stepButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surfacePressed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonPressed: {
    backgroundColor: Colors.divider,
  },
  stepButtonDisabled: {
    opacity: 0.5,
  },
  count: {
    fontSize: 16,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
    minWidth: 20,
    textAlign: 'center',
  },
});
