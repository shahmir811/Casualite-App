import { DrawerActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { CatalogueTile } from '@/components/catalogue-tile';
import { ScreenHeader } from '@/components/screen-header';
import { CatalogueTileSkeleton } from '@/components/skeleton';
import { EmptyView, ErrorView } from '@/components/state-views';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { CatalogueSummary } from '@/lib/types';
import { useApiQuery } from '@/lib/use-api-query';

// "Upcoming" was dropped (2026-10-13) — catalogues are only ever `open` or
// `closed` on the backend, there's no scheduled-release concept to back it,
// so it would have been a fake filter. "Past" was also dropped (2026-10-13)
// — it's status === 'closed', which `sold_out` already covers (backend's
// isSoldOut() is isClosed() || availablePieces() <= 0), so it was a second
// pill for the same set of catalogues. "New" (created_at within 14 days) was
// replaced with "Not Ordered" the same day — what a customer deciding what
// to order next actually wants, not recency. "Not Ordered" and "Sold Out"
// deliberately overlap (a sold-out catalogue the customer never ordered
// shows under both) rather than excluding each other.
const FILTERS = ['All', 'Not Ordered', 'Already Ordered', 'Sold Out'] as const;

function matchesFilter(catalogue: CatalogueSummary, filter: (typeof FILTERS)[number]): boolean {
  switch (filter) {
    case 'All':
      return true;
    case 'Not Ordered':
      return !catalogue.already_ordered;
    case 'Already Ordered':
      return catalogue.already_ordered;
    case 'Sold Out':
      return catalogue.sold_out;
  }
}

const EMPTY_MESSAGE: Record<(typeof FILTERS)[number], string> = {
  All: 'No catalogues yet.',
  'Not Ordered': "You've ordered every open catalogue.",
  'Already Ordered': "You haven't ordered any catalogues yet.",
  'Sold Out': 'No sold out catalogues.',
};

export default function CataloguesScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>('All');
  const { state, refreshing, refetch, onRefresh } = useApiQuery<{ catalogues: CatalogueSummary[] }>(
    '/api/catalogues'
  );

  // Refetch whenever this screen regains focus (e.g. back from placing an
  // order) so already_ordered reflects the order that was just placed.
  // Skips the very first focus — useApiQuery's own effect already fetches
  // on mount, so firing here too would double the request on initial load.
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      refetch();
    }, [refetch])
  );

  const header = <ScreenHeader title="Catalogues" onLeftPress={() => navigation.dispatch(DrawerActions.openDrawer())} />;

  const filterRow = (
    <View style={styles.filterRow}>
      {FILTERS.map((filter) => {
        const active = filter === activeFilter;
        return (
          <Pressable
            key={filter}
            style={[styles.filterPill, active && styles.filterPillActive]}
            onPress={() => setActiveFilter(filter)}>
            <Text style={[styles.filterText, active && styles.filterTextActive]}>{filter}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (state.status === 'loading') {
    return (
      <View style={styles.container}>
        {header}
        {filterRow}
        <View style={styles.list}>
          {Array.from({ length: 4 }).map((_, index) => (
            <CatalogueTileSkeleton key={index} />
          ))}
        </View>
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={styles.container}>
        {header}
        <ErrorView message={state.error.message} onRetry={refetch} />
      </View>
    );
  }

  const { catalogues } = state.data;

  if (catalogues.length === 0) {
    return (
      <View style={styles.container}>
        {header}
        <FlatList
          data={[]}
          renderItem={() => null}
          ListEmptyComponent={
            <EmptyView icon="pricetags-outline" message="No catalogues yet." />
          }
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
        />
      </View>
    );
  }

  const filteredCatalogues = catalogues.filter((catalogue) => matchesFilter(catalogue, activeFilter));

  return (
    <View style={styles.container}>
      {header}
      {filterRow}
      <FlatList
        data={filteredCatalogues}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <CatalogueTile catalogue={item} onPress={() => router.push(`/catalogues/${item.id}`)} />
        )}
        ListEmptyComponent={<EmptyView icon="pricetags-outline" message={EMPTY_MESSAGE[activeFilter]} />}
        contentContainerStyle={filteredCatalogues.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfacePressed,
  },
  filterPillActive: {
    backgroundColor: Colors.accent,
  },
  filterText: {
    fontSize: 13,
    fontWeight: Typography.weightMedium,
    color: Colors.textPrimary,
  },
  filterTextActive: {
    color: Colors.surface,
  },
  list: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  emptyContainer: {
    flexGrow: 1,
  },
});
