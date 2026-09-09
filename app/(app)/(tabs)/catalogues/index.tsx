import { DrawerActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useRef } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { CatalogueTile } from '@/components/catalogue-tile';
import { ScreenHeader } from '@/components/screen-header';
import { CatalogueTileSkeleton } from '@/components/skeleton';
import { EmptyView, ErrorView } from '@/components/state-views';
import { Colors, Spacing } from '@/constants/theme';
import { CatalogueSummary } from '@/lib/types';
import { useApiQuery } from '@/lib/use-api-query';

export default function CataloguesScreen() {
  const router = useRouter();
  const navigation = useNavigation();
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

  if (state.status === 'loading') {
    return (
      <View style={styles.container}>
        {header}
        <View style={styles.grid}>
          {Array.from({ length: 6 }).map((_, index) => (
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
      <FlatList
        data={catalogues}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  row: {
    gap: Spacing.md,
  },
  list: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  emptyContainer: {
    flexGrow: 1,
  },
});
