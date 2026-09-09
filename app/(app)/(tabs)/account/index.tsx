import { DrawerActions, useNavigation } from '@react-navigation/native';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/screen-header';
import { LedgerRowSkeleton, Skeleton } from '@/components/skeleton';
import { EmptyView, ErrorView } from '@/components/state-views';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { formatCurrency, formatDate, ledgerTypeLabel } from '@/lib/format';
import { LedgerEntry } from '@/lib/types';
import { useApiQuery } from '@/lib/use-api-query';

type LedgerResponse = {
  advance_credit_balance: string;
  ledger: LedgerEntry[];
};

export default function AccountScreen() {
  const navigation = useNavigation();
  const { state, refreshing, refetch, onRefresh } = useApiQuery<LedgerResponse>('/api/ledger');

  const header = (
    <ScreenHeader title="Account & Ledger" onLeftPress={() => navigation.dispatch(DrawerActions.openDrawer())} />
  );

  if (state.status === 'loading') {
    return (
      <View style={styles.container}>
        {header}
        <View style={styles.list}>
          <Skeleton width="100%" height={92} radius={Radius.card} style={{ marginBottom: Spacing.sm }} />
          {Array.from({ length: 6 }).map((_, index) => (
            <LedgerRowSkeleton key={index} />
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

  const { advance_credit_balance, ledger } = state.data;

  return (
    <View style={styles.container}>
      {header}
      <FlatList
        data={ledger}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <LedgerRow entry={item} />}
        ListHeaderComponent={<AdvanceBalanceCard balance={advance_credit_balance} />}
        ListEmptyComponent={<EmptyView icon="wallet-outline" message="No transactions yet." />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
      />
    </View>
  );
}

function AdvanceBalanceCard({ balance }: { balance: string }) {
  return (
    <View style={styles.balanceCard}>
      <Text style={styles.balanceLabel}>Advance Credit Balance</Text>
      <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
    </View>
  );
}

function LedgerRow({ entry }: { entry: LedgerEntry }) {
  const amount = parseFloat(entry.amount);
  const isDebit = amount > 0;
  const reference = entry.order_number ?? entry.payment_id;

  return (
    <View style={styles.row}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle}>{ledgerTypeLabel(entry.transaction_type)}</Text>
        <Text style={styles.rowSubtitle}>
          {formatDate(entry.created_at)}
          {reference ? ` · ${reference}` : ''}
        </Text>
      </View>
      <Text style={[styles.rowAmount, { color: isDebit ? Colors.error : Colors.success }]}>
        {formatCurrency(Math.abs(amount))}
      </Text>
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
  },
  balanceCard: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: Typography.weightSemibold,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    opacity: 0.85,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: Typography.weightBold,
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  rowInfo: {
    gap: 2,
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
  },
  rowSubtitle: {
    fontSize: 13,
    fontWeight: Typography.weightRegular,
    color: Colors.textSecondary,
  },
  rowAmount: {
    fontSize: 15,
    fontWeight: Typography.weightSemibold,
  },
});
