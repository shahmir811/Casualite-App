import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignPhoto } from '@/components/design-photo';
import { StatusBadge } from '@/components/status-badge';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { formatCurrency, formatDate } from '@/lib/format';
import { OrderSummary } from '@/lib/types';

const PHOTO_SIZE = 64;

export function OrderCard({ order, onPress }: { order: OrderSummary; onPress: () => void }) {
  const isPaid = parseFloat(order.outstanding_balance) <= 0;

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress}>
      <DesignPhoto url={order.catalogue.cover_photo_url} size={PHOTO_SIZE} />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <StatusBadge status={order.status} />
          <Text style={styles.date}>{formatDate(order.created_at)}</Text>
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.catalogueName} numberOfLines={1}>
            {order.catalogue.name}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
        </View>
        <Text style={styles.pieces}>
          {order.total_pieces} {order.total_pieces === 1 ? 'piece' : 'pieces'} · Order #{order.order_number}
        </Text>

        <View style={styles.divider} />

        <View style={styles.bottomRow}>
          <Text style={styles.amount}>{formatCurrency(order.total_amount)}</Text>
          {isPaid ? (
            <View style={[styles.pill, styles.paidPill]}>
              <Text style={[styles.pillText, styles.paidText]}>Paid</Text>
            </View>
          ) : (
            <View style={[styles.pill, styles.duePill]}>
              <Text style={[styles.pillText, styles.dueText]}>{formatCurrency(order.outstanding_balance)} due</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: Platform.OS === 'android' ? 2 : 0,
  },
  cardPressed: {
    backgroundColor: Colors.surfacePressed,
  },
  body: {
    flex: 1,
    gap: 6,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  catalogueName: {
    flex: 1,
    fontSize: 18,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
  },
  pieces: {
    fontSize: 14,
    fontWeight: Typography.weightRegular,
    color: Colors.textSecondary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.xs,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amount: {
    fontSize: 17,
    fontWeight: Typography.weightBold,
    color: Colors.textPrimary,
  },
  pill: {
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 13,
    fontWeight: Typography.weightSemibold,
  },
  paidPill: {
    backgroundColor: Colors.successSoft,
  },
  paidText: {
    color: Colors.success,
  },
  duePill: {
    backgroundColor: Colors.errorSoft,
  },
  dueText: {
    color: Colors.error,
  },
});
