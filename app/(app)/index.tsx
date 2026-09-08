import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AnnouncementCard } from '@/components/announcement-card';
import { BrandMasthead } from '@/components/brand-masthead';
import { OrderStatusTracker } from '@/components/order-status-tracker';
import { AnnouncementRowSkeleton, Skeleton } from '@/components/skeleton';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency } from '@/lib/format';
import { setBadgeCount } from '@/lib/push-notifications';
import { Announcement, OrderSummary } from '@/lib/types';
import { useApiQuery } from '@/lib/use-api-query';

type LedgerSummary = { advance_credit_balance: string };

export default function HomeScreen() {
  const { customer } = useAuth();
  const router = useRouter();

  // Reuses the same unpaginated endpoint the Announcements screen fetches —
  // "any unread" is just a client-side check over the full list, so no
  // dedicated unread-count endpoint is needed.
  const { state: announcementsState, refetch: refetchAnnouncements } = useApiQuery<{
    announcements: Announcement[];
  }>('/api/announcements');
  const unreadCount =
    announcementsState.status === 'success'
      ? announcementsState.data.announcements.filter((a) => a.read_at === null).length
      : 0;
  const hasUnread = unreadCount > 0;

  // Same endpoint the Orders list screen uses — only the most recent order
  // is shown here, as a status card, not a second orders list.
  const { state: ordersState, refetch: refetchOrders } = useApiQuery<{ orders: OrderSummary[] }>('/api/orders');
  const latestOrder = ordersState.status === 'success' ? (ordersState.data.orders[0] ?? null) : null;
  // Outstanding balance is a plain sum of figures the API already computed
  // per order — not a re-derivation of order pricing, just arithmetic.
  const outstandingTotal =
    ordersState.status === 'success'
      ? ordersState.data.orders.reduce((sum, order) => sum + parseFloat(order.outstanding_balance), 0)
      : 0;

  // Same endpoint the Account & Ledger screen uses — only the balance
  // figure is shown here, not the transaction history.
  const { state: ledgerState, refetch: refetchLedger } = useApiQuery<LedgerSummary>('/api/ledger');
  const advanceCredit = ledgerState.status === 'success' ? parseFloat(ledgerState.data.advance_credit_balance) : 0;

  const latestAnnouncement =
    announcementsState.status === 'success' ? (announcementsState.data.announcements[0] ?? null) : null;

  // Home stays mounted for the lifetime of the signed-in session (see the
  // AppState effect below), which makes it the one place that reliably sees
  // every unread-count change — keep the app icon badge in sync here rather
  // than duplicating this in each screen that happens to refetch the list.
  useEffect(() => {
    if (announcementsState.status === 'success') {
      void setBadgeCount(unreadCount);
    }
  }, [announcementsState.status, unreadCount]);

  const refetchAll = useCallback(() => {
    refetchAnnouncements();
    refetchOrders();
    refetchLedger();
  }, [refetchAnnouncements, refetchOrders, refetchLedger]);

  // A push arriving while the app is already in the foreground doesn't fire
  // the AppState 'active' transition below, so without this the unread count
  // (and badge) would stay stale until the next manual refresh.
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(() => refetchAll());
    return () => subscription.remove();
  }, [refetchAll]);

  // Refetch on regaining focus (e.g. back from Announcements after reading,
  // or from Catalogues after placing an order) and skip the very first
  // focus — the mount effect inside useApiQuery already fires that request.
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      refetchAll();
    }, [refetchAll])
  );

  // Home stays mounted underneath whatever screen is pushed on top of it, so
  // this also catches a push notification arriving while the app was
  // backgrounded — same AppState pattern used for push-token resync in
  // app/_layout.tsx.
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        refetchAll();
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, [refetchAll]);

  return (
    <View style={styles.container}>
      <BrandMasthead
        right={
          <Pressable
            style={({ pressed }) => [styles.bellWrap, pressed && styles.bellWrapPressed]}
            onPress={() => router.push('/announcements')}
            hitSlop={8}>
            <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
            {hasUnread ? <View style={styles.bellDot} /> : null}
          </Pressable>
        }
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Welcome, {customer?.name}</Text>

      {announcementsState.status === 'loading' ? (
        <View style={styles.announcementCard}>
          <AnnouncementRowSkeleton />
        </View>
      ) : latestAnnouncement ? (
        <View style={styles.announcementCard}>
          <AnnouncementCard
            announcement={latestAnnouncement}
            onPress={() => router.push(`/announcements/${latestAnnouncement.id}`)}
          />
        </View>
      ) : null}

      {ledgerState.status === 'loading' ? (
        <View style={styles.balanceCard}>
          <Skeleton width={120} height={11} radius={4} />
          <Skeleton width={150} height={26} radius={4} />
        </View>
      ) : ledgerState.status === 'success' ? (
        <Pressable
          style={({ pressed }) => [styles.balanceCard, pressed && styles.orderCardPressed]}
          onPress={() => router.push('/ledger')}>
          <Text style={styles.balanceLabel}>Outstanding Balance</Text>
          {outstandingTotal > 0 ? (
            <Text style={[styles.balanceValue, styles.balanceValueDue]}>{formatCurrency(outstandingTotal)}</Text>
          ) : (
            <Text style={[styles.balanceValue, styles.balanceValueClear]}>All paid up</Text>
          )}
          {advanceCredit > 0 ? (
            <View style={styles.balancePill}>
              <Text style={styles.balancePillText}>Advance credit {formatCurrency(advanceCredit)}</Text>
            </View>
          ) : null}
        </Pressable>
      ) : null}

      {ordersState.status === 'loading' ? (
        <View style={styles.orderCard}>
          <Skeleton width="60%" height={14} radius={4} />
          <View style={styles.orderCardSkeletonDots}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} width={12} height={12} radius={6} />
            ))}
          </View>
          <Skeleton width="45%" height={13} radius={4} />
        </View>
      ) : latestOrder ? (
        <Pressable
          style={({ pressed }) => [styles.orderCard, pressed && styles.orderCardPressed]}
          onPress={() => router.push(`/orders/${latestOrder.id}`)}>
          <View style={styles.orderCardTop}>
            <Text style={styles.orderCardLabel}>
              Order #{latestOrder.order_number} · {latestOrder.catalogue.name}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
          </View>
          <OrderStatusTracker status={latestOrder.status} compact />
          <View style={styles.orderCardFoot}>
            <Text style={styles.orderCardMeta}>
              {latestOrder.total_pieces} {latestOrder.total_pieces === 1 ? 'piece' : 'pieces'} ·{' '}
              {formatCurrency(latestOrder.total_amount)}
            </Text>
            {parseFloat(latestOrder.outstanding_balance) > 0 ? (
              <Text style={styles.orderCardDue}>{formatCurrency(latestOrder.outstanding_balance)} due</Text>
            ) : null}
          </View>
        </Pressable>
      ) : ordersState.status === 'success' ? (
        <Pressable
          style={({ pressed }) => [styles.emptyOrderCard, pressed && styles.orderCardPressed]}
          onPress={() => router.push('/catalogues')}>
          <Text style={styles.emptyOrderTitle}>No orders yet</Text>
          <Text style={styles.emptyOrderBody}>Browse the open catalogues to place your first order.</Text>
          <View style={styles.emptyOrderCta}>
            <Text style={styles.emptyOrderCtaText}>Browse Catalogues</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.accent} />
          </View>
        </Pressable>
      ) : null}

      <View style={styles.nav}>
        <NavRow icon="pricetags-outline" label="Browse Catalogues" onPress={() => router.push('/catalogues')} />
        <View style={styles.navDivider} />
        <NavRow icon="receipt-outline" label="My Orders" onPress={() => router.push('/orders')} />
        <View style={styles.navDivider} />
        <NavRow icon="wallet-outline" label="Account & Ledger" onPress={() => router.push('/ledger')} />
        <View style={styles.navDivider} />
        <NavRow icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} />
      </View>
      </ScrollView>
    </View>
  );
}

function NavRow({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.navRow, pressed && styles.navRowPressed]} onPress={onPress}>
      <Ionicons name={icon} size={20} color={Colors.textPrimary} />
      <Text style={styles.navLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  bellWrap: {
    position: 'relative',
    padding: 2,
    borderRadius: Radius.chip,
  },
  bellWrapPressed: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  bellDot: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.brandBlack,
  },
  greeting: {
    fontSize: 24,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
  },
  announcementCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  balanceCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: 6,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: Typography.weightSemibold,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontSize: 26,
    fontWeight: Typography.weightBold,
  },
  balanceValueDue: {
    color: Colors.error,
  },
  balanceValueClear: {
    color: Colors.success,
  },
  balancePill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.highlightSoft,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 2,
  },
  balancePillText: {
    fontSize: 12,
    fontWeight: Typography.weightSemibold,
    color: Colors.accent,
  },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  orderCardPressed: {
    backgroundColor: Colors.surfacePressed,
  },
  orderCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderCardLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
  },
  orderCardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderCardMeta: {
    fontSize: 13,
    fontWeight: Typography.weightRegular,
    color: Colors.textSecondary,
  },
  orderCardDue: {
    fontSize: 13,
    fontWeight: Typography.weightSemibold,
    color: Colors.error,
  },
  orderCardSkeletonDots: {
    flexDirection: 'row',
    gap: 8,
  },
  emptyOrderCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: 4,
  },
  emptyOrderTitle: {
    fontSize: 15,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
  },
  emptyOrderBody: {
    fontSize: 13,
    fontWeight: Typography.weightRegular,
    color: Colors.textSecondary,
  },
  emptyOrderCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  emptyOrderCtaText: {
    fontSize: 14,
    fontWeight: Typography.weightSemibold,
    color: Colors.accent,
  },
  nav: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  navRowPressed: {
    backgroundColor: Colors.surfacePressed,
  },
  navDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: Spacing.md + 20 + Spacing.sm,
  },
  navLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: Typography.weightMedium,
    color: Colors.textPrimary,
  },
});
