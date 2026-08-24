import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '@/components/status-badge';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { formatCurrency, formatDate } from '@/lib/format';
import { OrderSummary } from '@/lib/types';

export function OrderCard({ order, onPress }: { order: OrderSummary; onPress: () => void }) {
  const isPaid = parseFloat(order.outstanding_balance) <= 0;

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress}>
      <View style={styles.topRow}>
        <StatusBadge status={order.status} />
        <Text style={styles.date}>{formatDate(order.created_at)}</Text>
      </View>

      <Text style={styles.catalogueName}>{order.catalogue.name}</Text>
      <Text style={styles.pieces}>
        {order.total_pieces} {order.total_pieces === 1 ? 'piece' : 'pieces'} · Order #{order.order_number}
      </Text>

      <View style={styles.bottomRow}>
        <Text style={styles.amount}>{formatCurrency(order.total_amount)}</Text>
        {isPaid ? (
          <Text style={styles.paid}>Paid</Text>
        ) : (
          <Text style={styles.due}>{formatCurrency(order.outstanding_balance)} due</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: 6,
  },
  cardPressed: {
    backgroundColor: Colors.surfacePressed,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    fontSize: 13,
    fontWeight: Typography.weightRegular,
    color: Colors.textTertiary,
  },
  catalogueName: {
    fontSize: 17,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
  },
  pieces: {
    fontSize: 14,
    fontWeight: Typography.weightRegular,
    color: Colors.textSecondary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  amount: {
    fontSize: 16,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
  },
  paid: {
    fontSize: 14,
    fontWeight: Typography.weightSemibold,
    color: Colors.success,
  },
  due: {
    fontSize: 14,
    fontWeight: Typography.weightSemibold,
    color: Colors.error,
  },
});
