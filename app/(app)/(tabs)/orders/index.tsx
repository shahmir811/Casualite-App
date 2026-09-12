import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { OrderCard } from '@/components/order-card';
import { ScreenHeader } from '@/components/screen-header';
import { OrderCardSkeleton } from '@/components/skeleton';
import { EmptyView, ErrorView } from '@/components/state-views';
import { Colors, Spacing } from '@/constants/theme';
import { useApiQuery } from '@/lib/use-api-query';
import { OrderSummary } from '@/lib/types';

export default function OrdersScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { state, refreshing, refetch, onRefresh } = useApiQuery<{ orders: OrderSummary[] }>('/api/orders');

  const header = <ScreenHeader title="My Orders" onLeftPress={() => navigation.dispatch(DrawerActions.openDrawer())} />;

  if (state.status === 'loading') {
    return (
      <View style={styles.container}>
        {header}
        <View style={styles.list}>
          {Array.from({ length: 5 }).map((_, index) => (
            <OrderCardSkeleton key={index} />
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

  const { orders } = state.data;

  if (orders.length === 0) {
    return (
      <View style={styles.container}>
        {header}
        <FlatList
          data={[]}
          renderItem={() => null}
          ListEmptyComponent={<EmptyView icon="receipt-outline" message="No orders yet." />}
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
        data={orders}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <OrderCard order={item} onPress={() => router.push(`/orders/${item.id}`)} />
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
    gap: Spacing.sm,
  },
  emptyContainer: {
    flexGrow: 1,
  },
});
