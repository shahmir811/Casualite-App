import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { GuestCatalogueTile } from '@/components/guest-catalogue-tile';
import { CatalogueTileSkeleton } from '@/components/skeleton';
import { EmptyView, ErrorView } from '@/components/state-views';
import { Colors, Spacing } from '@/constants/theme';
import { PublicCatalogueSummary } from '@/lib/types';
import { useApiQuery } from '@/lib/use-api-query';

// Pre-login browsing for the Wholesale destination — see Guideline 5.1.1(v).
// Catalogue browsing isn't account-based, so it's reachable without signing
// in; pricing and ordering still require login (prompted from the detail
// screen). Mirrors app/(app)/(tabs)/catalogues/index.tsx, minus the filter
// row and already_ordered state, neither of which apply to a guest.
export default function CataloguesPreviewScreen() {
  const router = useRouter();
  const { state, refreshing, refetch, onRefresh } = useApiQuery<{ catalogues: PublicCatalogueSummary[] }>(
    '/api/public/catalogues'
  );

  if (state.status === 'loading') {
    return (
      <View style={styles.container}>
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
        <ErrorView message={state.error.message} onRetry={refetch} />
      </View>
    );
  }

  const { catalogues } = state.data;

  if (catalogues.length === 0) {
    return (
      <View style={styles.container}>
        <FlatList
          data={[]}
          renderItem={() => null}
          ListEmptyComponent={<EmptyView icon="pricetags-outline" message="No catalogues yet." />}
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={catalogues}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <GuestCatalogueTile catalogue={item} onPress={() => router.push(`/catalogues-preview/${item.id}`)} />
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
  list: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  emptyContainer: {
    flexGrow: 1,
  },
});
