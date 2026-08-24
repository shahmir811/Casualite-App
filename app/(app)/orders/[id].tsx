import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DesignPhoto } from '@/components/design-photo';
import { Section } from '@/components/section';
import { SizeBreakdownRow } from '@/components/size-breakdown-row';
import { StatusBadge } from '@/components/status-badge';
import { EmptyView, ErrorView, LoadingView } from '@/components/state-views';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { ApiError } from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/format';
import { DispatchBatchItem, OrderDetail } from '@/lib/types';
import { useApiQuery } from '@/lib/use-api-query';

function groupBatchItemsByDesign(items: DispatchBatchItem[]) {
  const designs: { design: string; sizes: string }[] = [];
  const indexByDesign = new Map<string, number>();

  for (const item of items) {
    const existingIndex = indexByDesign.get(item.design);
    const sizeEntry = `${item.size.toUpperCase()}×${item.quantity}`;
    if (existingIndex === undefined) {
      indexByDesign.set(item.design, designs.length);
      designs.push({ design: item.design, sizes: sizeEntry });
    } else {
      designs[existingIndex].sizes += `  ${sizeEntry}`;
    }
  }

  return designs;
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { state, refetch } = useApiQuery<{ order: OrderDetail }>(id ? `/api/orders/${id}` : null);
  const [expandedBatchIds, setExpandedBatchIds] = useState<Set<number>>(new Set());

  const toggleBatch = (batchId: number) => {
    setExpandedBatchIds((current) => {
      const next = new Set(current);
      if (next.has(batchId)) {
        next.delete(batchId);
      } else {
        next.add(batchId);
      }
      return next;
    });
  };

  if (state.status === 'loading') return <LoadingView />;

  if (state.status === 'error') {
    if (state.error instanceof ApiError && state.error.status === 404) {
      return <EmptyView message="Order not found." />;
    }
    return <ErrorView message={state.error.message} onRetry={refetch} />;
  }

  const { order } = state.data;
  const isPaid = parseFloat(order.outstanding_balance) <= 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: Spacing.md + insets.bottom + Spacing.lg }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.orderNumber}>Order #{order.order_number}</Text>
          <StatusBadge status={order.status} />
        </View>
        <Text style={styles.date}>
          {formatDate(order.created_at)} · {order.catalogue.name}
        </Text>
      </View>

      <View style={styles.card}>
        <SummaryRow label="Order total" value={formatCurrency(order.total_amount)} />
        <SummaryRow label="Paid" value={formatCurrency(order.total_paid)} />
        <SummaryRow
          label="Outstanding"
          value={formatCurrency(order.outstanding_balance)}
          valueColor={isPaid ? Colors.success : Colors.error}
        />
      </View>

      {order.catalogue.hd_gallery_url ? (
        <Pressable
          style={({ pressed }) => [styles.hdButton, pressed && styles.hdButtonPressed]}
          onPress={() => WebBrowser.openBrowserAsync(order.catalogue.hd_gallery_url!)}>
          <Ionicons name="images-outline" size={18} color={Colors.accent} />
          <Text style={styles.hdButtonText}>View HD Photos</Text>
        </Pressable>
      ) : null}

      <Section title="Size breakdown">
        <SizeBreakdownRow breakdown={order.size_breakdown} />
      </Section>

      <Section title="Pieces ordered">
        <View style={styles.card}>
          {order.items.map((item, index) => (
            <View key={item.id} style={[styles.row, index > 0 && styles.rowBorder]}>
              <DesignPhoto url={item.design.photo_url} />
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle}>{item.design.name}</Text>
                <Text style={styles.rowSubtitle}>
                  {item.total_qty} {item.total_qty === 1 ? 'piece' : 'pieces'} · {formatCurrency(item.unit_price)}{' '}
                  each
                </Text>
              </View>
              <Text style={styles.rowAmount}>{formatCurrency(item.total_amount)}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Payments">
        {order.payments.length === 0 ? (
          <Text style={styles.emptyText}>No payments recorded yet.</Text>
        ) : (
          <View style={styles.card}>
            {order.payments.map((payment, index) => (
              <View key={payment.id} style={[styles.row, index > 0 && styles.rowBorder]}>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle}>{payment.payment_id}</Text>
                  <Text style={styles.rowSubtitle}>
                    {formatDate(payment.payment_date)}
                    {payment.bank_account ? ` · ${payment.bank_account}` : ''}
                  </Text>
                </View>
                <Text style={[styles.rowAmount, { color: Colors.success }]}>{formatCurrency(payment.amount)}</Text>
              </View>
            ))}
          </View>
        )}
      </Section>

      {order.dispatch_batches.length > 0 ? (
        <Section title="Dispatch batches">
          <View style={styles.batchList}>
            {order.dispatch_batches.map((batch) => {
              const isExpanded = expandedBatchIds.has(batch.id);
              const designs = groupBatchItemsByDesign(batch.items);
              return (
                <View key={batch.id} style={styles.card}>
                  <View style={styles.batchHeader}>
                    <Text style={styles.rowTitle}>Batch {batch.batch_number}</Text>
                    <Text style={styles.rowSubtitle}>{formatDate(batch.dispatch_date)}</Text>
                  </View>
                  <Text style={styles.rowSubtitle}>
                    {batch.total_pieces} pieces · {batch.shipping_address}
                  </Text>

                  {designs.length > 0 ? (
                    <Pressable
                      style={({ pressed }) => [styles.disclosure, pressed && styles.hdButtonPressed]}
                      onPress={() => toggleBatch(batch.id)}>
                      <Text style={styles.disclosureText}>{isExpanded ? 'Hide pieces' : 'View pieces'}</Text>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={Colors.accent}
                      />
                    </Pressable>
                  ) : null}

                  {isExpanded ? (
                    <View style={styles.batchItemList}>
                      {designs.map((entry) => (
                        <View key={entry.design} style={styles.batchItemRow}>
                          <Text style={styles.batchItemDesign}>{entry.design}</Text>
                          <Text style={styles.batchItemSizes}>{entry.sizes}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {batch.cargo_document_url ? (
                    <Pressable
                      style={({ pressed }) => [styles.docLink, pressed && styles.hdButtonPressed]}
                      onPress={() => WebBrowser.openBrowserAsync(batch.cargo_document_url!)}>
                      <Ionicons name="document-text-outline" size={16} color={Colors.accent} />
                      <Text style={styles.docLinkText}>Cargo document</Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
        </Section>
      ) : null}
    </ScrollView>
  );
}

function SummaryRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.rowSubtitle}>{label}</Text>
      <Text style={[styles.rowAmount, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.lg,
  },
  header: {
    gap: 4,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: Typography.weightBold,
    color: Colors.textPrimary,
  },
  date: {
    fontSize: 14,
    fontWeight: Typography.weightRegular,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hdButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: Radius.pill,
    paddingVertical: 12,
  },
  hdButtonPressed: {
    opacity: 0.7,
  },
  hdButtonText: {
    fontSize: 15,
    fontWeight: Typography.weightSemibold,
    color: Colors.accent,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
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
    color: Colors.textPrimary,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: Typography.weightRegular,
    color: Colors.textTertiary,
  },
  batchList: {
    gap: Spacing.sm,
  },
  batchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  disclosure: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingVertical: 4,
  },
  disclosureText: {
    fontSize: 13,
    fontWeight: Typography.weightSemibold,
    color: Colors.accent,
  },
  batchItemList: {
    gap: 6,
    paddingTop: 2,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  batchItemRow: {
    gap: 1,
  },
  batchItemDesign: {
    fontSize: 13,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
  },
  batchItemSizes: {
    fontSize: 12,
    fontWeight: Typography.weightRegular,
    color: Colors.textSecondary,
  },
  docLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.xs,
  },
  docLinkText: {
    fontSize: 14,
    fontWeight: Typography.weightSemibold,
    color: Colors.accent,
  },
});
