import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';

import { OrderCard } from '@/components/order-card';
import { EmptyView, ErrorView, LoadingView } from '@/components/state-views';
import { Colors, Spacing } from '@/constants/theme';
import { useApiQuery } from '@/lib/use-api-query';
import { OrderSummary } from '@/lib/types';

export default function OrdersScreen() {
  const router = useRouter();
  const { state, refreshing, refetch, onRefresh } = useApiQuery<{ orders: OrderSummary[] }>('/api/orders');

  if (state.status === 'loading') return <LoadingView />;

  if (state.status === 'error') {
    return <ErrorView message={state.error.message} onRetry={refetch} />;
  }

  const { orders } = state.data;

  if (orders.length === 0) {
    return (
      <FlatList
        data={[]}
        renderItem={() => null}
        ListEmptyComponent={<EmptyView message="No orders yet." />}
        contentContainerStyle={styles.emptyContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
      />
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <OrderCard order={item} onPress={() => router.push(`/orders/${item.id}`)} />
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
