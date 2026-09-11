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
import { AnnouncementRowSkeleton, Skeleton } from '@/components/skeleton';
import { StatusBadge } from '@/components/status-badge';
import { UnreadBadge } from '@/components/unread-badge';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAnnouncements } from '@/lib/announcements-context';
import { formatCurrency, formatRelativeTime } from '@/lib/format';
import { setBadgeCount } from '@/lib/push-notifications';
import { CatalogueSummary, OrderSummary } from '@/lib/types';
import { useApiQuery } from '@/lib/use-api-query';

type LedgerSummary = { advance_credit_balance: string };
const CATALOGUE_TEASER_WIDTH = 132;
const CATALOGUE_TEASER_HEIGHT = 172;

export default function HomeScreen() {
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
  // "Active" = still moving through the pipeline — not yet fully dispatched
  // and not cancelled.
  const activeOrdersCount =
    ordersState.status === 'success'
      ? ordersState.data.orders.filter((order) => order.status !== 'dispatched' && order.status !== 'cancelled').length
      : 0;

  // Same endpoint the Account & Ledger screen uses — only the balance
  // figure is shown here, not the transaction history.
  const { state: ledgerState, refetch: refetchLedger } = useApiQuery<LedgerSummary>('/api/ledger');
  const advanceCredit = ledgerState.status === 'success' ? parseFloat(ledgerState.data.advance_credit_balance) : 0;

  const latestAnnouncement =
    announcementsState.status === 'success' ? (announcementsState.data.announcements[0] ?? null) : null;

  // /api/catalogues now returns every catalogue, open and closed (newest
  // first — CatalogueController@index's ->latest(), defaulting to
  // created_at desc), for the Catalogues list's full browsing history. This
  // teaser strip is specifically "what can I order right now", so it still
  // narrows to open, not-sold-out, not-already-ordered ones.
  const { state: cataloguesState, refetch: refetchCatalogues } = useApiQuery<{ catalogues: CatalogueSummary[] }>(
    '/api/catalogues'
  );
  const orderableCatalogues =
    cataloguesState.status === 'success'
      ? cataloguesState.data.catalogues.filter((c) => c.status === 'open' && !c.sold_out && !c.already_ordered)
      : [];
  // The first entry is always the most recently created catalogue overall
  // (open or closed) — no separate timestamp needed.
  const newestCatalogueId = cataloguesState.status === 'success' ? cataloguesState.data.catalogues[0]?.id : undefined;
  // Top 5 most recent catalogues with a cover photo, open or closed — this
  // carousel is a decorative "recent collections" showcase, not an order
  // shortcut (its button always opens the Catalogues list), so closed ones
  // are still worth showing.
  const heroCatalogues =
    cataloguesState.status === 'success'
      ? cataloguesState.data.catalogues.filter((c) => Boolean(c.cover_photo_url)).slice(0, 5)
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
      <HomeHero
        catalogues={heroCatalogues}
        newestId={newestCatalogueId}
        onExplorePress={() => router.push('/catalogues')}
      />

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

      {ordersState.status === 'loading' || ledgerState.status === 'loading' ? (
        <View style={styles.section}>
          <View style={styles.statRow}>
            {Array.from({ length: 2 }).map((_, index) => (
              <View key={index} style={styles.statCard}>
                <Skeleton width={32} height={32} radius={16} />
                <Skeleton width="50%" height={20} radius={4} />
                <Skeleton width="75%" height={12} radius={4} />
              </View>
            ))}
          </View>
        </View>
      ) : ordersState.status === 'success' && ledgerState.status === 'success' ? (
        <View style={styles.section}>
          <View style={styles.statRow}>
            <Pressable
              style={({ pressed }) => [styles.statCard, pressed && styles.statCardPressed]}
              onPress={() => router.push('/orders')}>
              <View style={styles.statIconWrap}>
                <Ionicons name="bag-outline" size={18} color={Colors.textPrimary} />
              </View>
              <Text style={styles.statValue}>{activeOrdersCount}</Text>
              <Text style={styles.statLabel}>Active Orders</Text>
              <View style={styles.statArrow}>
                <Ionicons name="arrow-forward" size={16} color={Colors.textPrimary} />
              </View>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.statCard, pressed && styles.statCardPressed]}
              onPress={() => router.push('/account')}>
              <View style={[styles.statIconWrap, outstandingTotal > 0 && styles.statIconWrapWarn]}>
                <Ionicons
                  name={outstandingTotal > 0 ? 'alert-circle-outline' : 'wallet-outline'}
                  size={18}
                  color={outstandingTotal > 0 ? Colors.error : Colors.textPrimary}
                />
              </View>
              <Text style={[styles.statValue, outstandingTotal > 0 && styles.statValueWarn]}>
                {formatCurrency(outstandingTotal > 0 ? outstandingTotal : advanceCredit)}
              </Text>
              <Text style={styles.statLabel}>{outstandingTotal > 0 ? 'Outstanding Balance' : 'Credit Balance'}</Text>
              <View style={styles.statArrow}>
                <Ionicons name="arrow-forward" size={16} color={Colors.textPrimary} />
              </View>
            </Pressable>
          </View>
        </View>
      ) : null}

      {ordersState.status === 'loading' ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Update</Text>
          <View style={styles.updateCard}>
            <Skeleton width={40} height={40} radius={20} />
            <View style={styles.updateSkeletonBody}>
              <Skeleton width="70%" height={14} radius={4} />
              <Skeleton width="45%" height={12} radius={4} />
            </View>
          </View>
        </View>
      ) : latestOrder ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Update</Text>
            <Pressable onPress={() => router.push('/orders')} hitSlop={8}>
              <Text style={styles.sectionLink}>View All</Text>
            </Pressable>
          </View>
          <Pressable
            style={({ pressed }) => [styles.updateCard, pressed && styles.orderCardPressed]}
            onPress={() => router.push(`/orders/${latestOrder.id}`)}>
            <View style={styles.updateIconWrap}>
              <Ionicons name="bag-handle-outline" size={18} color={Colors.textPrimary} />
            </View>
            <View style={styles.updateBody}>
              <Text style={styles.updateTitle} numberOfLines={1}>
                Order #{latestOrder.order_number}
              </Text>
              <Text style={styles.updateMeta} numberOfLines={1}>
                {latestOrder.total_pieces} {latestOrder.total_pieces === 1 ? 'piece' : 'pieces'} ·{' '}
                {latestOrder.catalogue.name}
              </Text>
            </View>
            <View style={styles.updateRight}>
              <StatusBadge status={latestOrder.status} />
              <Text style={styles.updateTime}>{formatRelativeTime(latestOrder.created_at)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
          </Pressable>
        </View>
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

      {cataloguesState.status === 'loading' ? (
        <View style={styles.catalogueSection}>
          <Skeleton width={130} height={13} radius={4} />
          <View style={styles.catalogueStrip}>
            {Array.from({ length: 3 }).map((_, index) => (
              <View key={index} style={styles.catalogueTeaser}>
                <Skeleton width={CATALOGUE_TEASER_WIDTH} height={CATALOGUE_TEASER_HEIGHT} radius={Radius.chip} />
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
                <View>
                  <DesignPhoto url={catalogue.cover_photo_url} size={CATALOGUE_TEASER_WIDTH} height={CATALOGUE_TEASER_HEIGHT} />
                  {catalogue.id === newestCatalogueId ? (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>New</Text>
                    </View>
                  ) : null}
                </View>
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
  announcementCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  section: {
    gap: Spacing.sm,
  },
  orderCardPressed: {
    backgroundColor: Colors.surfacePressed,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: 4,
  },
  statCardPressed: {
    backgroundColor: Colors.surfacePressed,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statIconWrapWarn: {
    backgroundColor: Colors.errorSoft,
  },
  statValue: {
    fontSize: 20,
    fontWeight: Typography.weightBold,
    color: Colors.textPrimary,
  },
  statValueWarn: {
    color: Colors.error,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: Typography.weightRegular,
    color: Colors.textSecondary,
  },
  statArrow: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfacePressed,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  updateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  updateSkeletonBody: {
    flex: 1,
    gap: 6,
  },
  updateIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateBody: {
    flex: 1,
    gap: 2,
  },
  updateTitle: {
    fontSize: 15,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
  },
  updateMeta: {
    fontSize: 13,
    fontWeight: Typography.weightRegular,
    color: Colors.textSecondary,
  },
  updateRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  updateTime: {
    fontSize: 12,
    fontWeight: Typography.weightRegular,
    color: Colors.textTertiary,
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
    width: CATALOGUE_TEASER_WIDTH,
    gap: 6,
  },
  catalogueTeaserPressed: {
    opacity: 0.7,
  },
  catalogueTeaserName: {
    fontSize: 12,
    fontWeight: Typography.weightMedium,
    color: Colors.textPrimary,
    textTransform: 'uppercase',
  },
  newBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: Colors.brandBlack,
    borderRadius: Radius.chip,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: Typography.weightSemibold,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
