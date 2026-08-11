import { StyleSheet, Text, View } from 'react-native';

import { Radius, StatusColors, Typography } from '@/constants/theme';
import { orderStatusLabel } from '@/lib/format';
import { OrderStatus } from '@/lib/types';

export function StatusBadge({ status }: { status: OrderStatus }) {
  const colors = StatusColors[status];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{orderStatusLabel(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: Typography.weightSemibold,
  },
});
