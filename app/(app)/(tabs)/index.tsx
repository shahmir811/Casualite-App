import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnnouncementCard } from '@/components/announcement-card';
import { BrandMasthead } from '@/components/brand-masthead';
import { DesignPhoto } from '@/components/design-photo';
import { HomeHero } from '@/components/home-hero';
import { OrderStatusTracker } from '@/components/order-status-tracker';
import { AnnouncementRowSkeleton, Skeleton } from '@/components/skeleton';
import { UnreadBadge } from '@/components/unread-badge';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAnnouncements } from '@/lib/announcements-context';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency } from '@/lib/format';
import { setBadgeCount } from '@/lib/push-notifications';
import { CatalogueSummary, OrderSummary } from '@/lib/types';
import { useApiQuery } from '@/lib/use-api-query';

type LedgerSummary = { advance_credit_balance: string };
const CATALOGUE_TEASER_SIZE = 112;

export default function HomeScreen() {
  const { customer } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Shared with the drawer's Notifications row and the Announcements list/
  // detail screens — see lib/announcements-context.tsx. Those screens
  // refetch this shared state themselves the moment something is marked
  // read, so Home doesn't need its own focus-triggered refetch for this one.
  const { state: announcementsState, unreadCount } = useAnnouncements();

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

  // Only catalogues an order can actually be placed on — a "come order
  // these" teaser shouldn't tease ones that are sold out or already ordered.
  const { state: cataloguesState, refetch: refetchCatalogues } = useApiQuery<{ catalogues: CatalogueSummary[] }>(
    '/api/catalogues'
  );
  const orderableCatalogues =
    cataloguesState.status === 'success'
      ? cataloguesState.data.catalogues.filter((c) => !c.sold_out && !c.already_ordered)
      : [];
  // Every open catalogue's cover, not just orderable ones — this is purely
  // decorative, so a catalogue being sold out shouldn't drop it from rotation.
  const heroImages =
    cataloguesState.status === 'success'
      ? cataloguesState.data.catalogues.map((c) => c.cover_photo_url).filter((url): url is string => Boolean(url))
      : [];

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
    refetchOrders();
    refetchLedger();
    refetchCatalogues();
  }, [refetchOrders, refetchLedger, refetchCatalogues]);

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
        left={
          <Pressable
            style={({ pressed }) => [styles.bellWrap, pressed && styles.bellWrapPressed]}
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            hitSlop={8}>
            <Ionicons name="menu-outline" size={24} color="#FFFFFF" />
          </Pressable>
        }
        right={
          <Pressable
            style={({ pressed }) => [styles.bellWrap, pressed && styles.bellWrapPressed]}
            onPress={() => router.push('/announcements')}
            hitSlop={8}>
            <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
            <UnreadBadge count={unreadCount} style={styles.bellBadge} />
          </Pressable>
        }
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Spacing.lg + insets.bottom + Spacing.lg }]}>
      <HomeHero images={heroImages}>
        <Text style={styles.greeting}>Welcome, {customer?.name}</Text>
      </HomeHero>

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

      {ledgerState.status === 'success' && outstandingTotal > 0 ? (
        <Pressable
          style={({ pressed }) => [styles.balanceBanner, styles.balanceBannerDue, pressed && styles.orderCardPressed]}
          onPress={() => router.push('/account')}>
          <Ionicons name="alert-circle-outline" size={20} color={Colors.error} />
          <Text style={styles.balanceBannerDueText}>{formatCurrency(outstandingTotal)} outstanding</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.error} />
        </Pressable>
      ) : ledgerState.status === 'success' && advanceCredit > 0 ? (
        <Pressable
          style={({ pressed }) => [styles.balanceBanner, styles.balanceBannerCredit, pressed && styles.orderCardPressed]}
          onPress={() => router.push('/account')}>
          <Ionicons name="wallet-outline" size={20} color={Colors.accent} />
          <Text style={styles.balanceBannerCreditText}>{formatCurrency(advanceCredit)} advance credit</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.accent} />
        </Pressable>
      ) : null}

      {cataloguesState.status === 'loading' ? (
        <View style={styles.catalogueSection}>
          <Skeleton width={130} height={13} radius={4} />
          <View style={styles.catalogueStrip}>
            {Array.from({ length: 3 }).map((_, index) => (
              <View key={index} style={styles.catalogueTeaser}>
                <Skeleton width={CATALOGUE_TEASER_SIZE} height={CATALOGUE_TEASER_SIZE} radius={Radius.chip} />
                <Skeleton width="75%" height={12} radius={4} />
              </View>
            ))}
          </View>
        </View>
      ) : orderableCatalogues.length > 0 ? (
        <View style={styles.catalogueSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Open Catalogues</Text>
            <Pressable onPress={() => router.push('/catalogues')} hitSlop={8}>
              <Text style={styles.sectionLink}>See all</Text>
            </Pressable>
          </View>
          <FlatList
            data={orderableCatalogues}
            keyExtractor={(item) => String(item.id)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catalogueStrip}
            renderItem={({ item: catalogue }) => (
              <Pressable
                style={({ pressed }) => [styles.catalogueTeaser, pressed && styles.catalogueTeaserPressed]}
                onPress={() => router.push(`/catalogues/${catalogue.id}`)}>
                <DesignPhoto url={catalogue.cover_photo_url} size={CATALOGUE_TEASER_SIZE} />
                <Text style={styles.catalogueTeaserName} numberOfLines={1}>
                  {catalogue.name}
                </Text>
              </Pressable>
            )}
          />
        </View>
      ) : null}
      </ScrollView>
    </View>
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
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    borderWidth: 1.5,
    borderColor: Colors.brandBlack,
  },
  greeting: {
    fontSize: 24,
    fontWeight: Typography.weightSemibold,
    color: '#FFFFFF',
  },
  announcementCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  balanceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.card,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  balanceBannerDue: {
    backgroundColor: Colors.errorSoft,
  },
  balanceBannerCredit: {
    backgroundColor: Colors.highlightSoft,
  },
  balanceBannerDueText: {
    flex: 1,
    fontSize: 15,
    fontWeight: Typography.weightSemibold,
    color: Colors.error,
  },
  balanceBannerCreditText: {
    flex: 1,
    fontSize: 15,
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
  catalogueSection: {
    gap: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: Typography.weightSemibold,
    color: Colors.accent,
  },
  catalogueStrip: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  catalogueTeaser: {
    width: CATALOGUE_TEASER_SIZE,
    gap: 6,
  },
  catalogueTeaserPressed: {
    opacity: 0.7,
  },
  catalogueTeaserName: {
    fontSize: 12,
    fontWeight: Typography.weightMedium,
    color: Colors.textPrimary,
  },
});
