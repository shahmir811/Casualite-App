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

// Visual only, per the owner's 2026-09-11 design feedback — /api/catalogues
// only ever returns open catalogues (CLAUDE.md §6), so there's no data yet
// to tell "New" from "Upcoming" from "Past". Only "All" actually filters;
// the rest are placeholders until the backend carries that distinction.
const FILTERS = ['All', 'New', 'Upcoming', 'Past'] as const;

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
            <EmptyView icon="pricetags-outline" message="No catalogues are open right now." />
          }
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {header}
      {filterRow}
      <FlatList
        data={catalogues}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <CatalogueTile catalogue={item} onPress={() => router.push(`/catalogues/${item.id}`)} />
        )}
        contentContainerStyle={styles.list}
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
