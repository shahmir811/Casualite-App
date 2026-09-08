import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useRef } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { CatalogueCard } from '@/components/catalogue-card';
import { CatalogueCardSkeleton } from '@/components/skeleton';
import { EmptyView, ErrorView } from '@/components/state-views';
import { Colors, Spacing } from '@/constants/theme';
import { CatalogueSummary } from '@/lib/types';
import { useApiQuery } from '@/lib/use-api-query';

export default function CataloguesScreen() {
  const router = useRouter();
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

  if (state.status === 'loading') {
    return (
      <View style={styles.list}>
        {Array.from({ length: 5 }).map((_, index) => (
          <CatalogueCardSkeleton key={index} />
        ))}
      </View>
    );
  }

  if (state.status === 'error') {
    return <ErrorView message={state.error.message} onRetry={refetch} />;
  }

  const { catalogues } = state.data;

  if (catalogues.length === 0) {
    return (
      <FlatList
        data={[]}
        renderItem={() => null}
        ListEmptyComponent={
          <EmptyView icon="pricetags-outline" message="No catalogues are open right now." />
        }
        contentContainerStyle={styles.emptyContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
      />
    );
  }

  return (
    <FlatList
      data={catalogues}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <CatalogueCard catalogue={item} onPress={() => router.push(`/catalogues/${item.id}`)} />
      )}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  emptyContainer: {
    flexGrow: 1,
  },
});
