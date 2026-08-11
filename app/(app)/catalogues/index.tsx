import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';

import { CatalogueCard } from '@/components/catalogue-card';
import { EmptyView, ErrorView, LoadingView } from '@/components/state-views';
import { Colors, Spacing } from '@/constants/theme';
import { CatalogueSummary } from '@/lib/types';
import { useApiQuery } from '@/lib/use-api-query';

export default function CataloguesScreen() {
  const router = useRouter();
  const { state, refreshing, refetch, onRefresh } = useApiQuery<{ catalogues: CatalogueSummary[] }>(
    '/api/catalogues'
  );

  if (state.status === 'loading') return <LoadingView />;

  if (state.status === 'error') {
    return <ErrorView message={state.error.message} onRetry={refetch} />;
  }

  const { catalogues } = state.data;

  if (catalogues.length === 0) {
    return (
      <FlatList
        data={[]}
        renderItem={() => null}
        ListEmptyComponent={<EmptyView message="No catalogues are open right now." />}
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
