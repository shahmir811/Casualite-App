import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { DesignTile } from '@/components/design-tile';
import { QuantityStepperRow } from '@/components/quantity-stepper-row';
import { EmptyView, ErrorView, LoadingView } from '@/components/state-views';
import { Colors, Radius, Spacing, StatusColors, Typography } from '@/constants/theme';
import { apiClient, ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency } from '@/lib/format';
import { CatalogueDetail, OrderDetail, SizeBreakdown } from '@/lib/types';
import { useApiQuery } from '@/lib/use-api-query';
import { QuoteState, useQuote } from '@/lib/use-quote';

const EMPTY_SIZES: SizeBreakdown = { xs: 0, s: 0, m: 0, l: 0, xl: 0 };

export default function CatalogueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { logout } = useAuth();
  const catalogueId = id ? Number(id) : null;

  const { state, refetch } = useApiQuery<{ catalogue: CatalogueDetail }>(id ? `/api/catalogues/${id}` : null);
  const [sizes, setSizes] = useState<SizeBreakdown>(EMPTY_SIZES);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const quote = useQuote(catalogueId, sizes);

  if (state.status === 'loading') return <LoadingView />;

  if (state.status === 'error') {
    return <ErrorView message={state.error.message} onRetry={refetch} />;
  }

  const { catalogue } = state.data;

  // Both cases block a real order server-side, so there's no form to show —
  // same treatment as the web app's sold-out screen.
  if (catalogue.sold_out) {
    return <EmptyView message="This catalogue is sold out." />;
  }
  if (catalogue.already_ordered) {
    return <EmptyView message="You've already placed an order on this catalogue." />;
  }

  const piecesPerDesign = sizes.xs + sizes.s + sizes.m + sizes.l + sizes.xl;
  const canSubmit = piecesPerDesign > 0 && !submitting;

  const hint =
    catalogue.quantity_benchmark != null && piecesPerDesign > 0 && piecesPerDesign <= catalogue.quantity_benchmark
      ? catalogue.quantity_benchmark + 1 - piecesPerDesign
      : null;

  const handleChange = (size: keyof SizeBreakdown, value: number) => {
    setSizes((prev) => ({ ...prev, [size]: value }));
  };

  const handleSubmit = async () => {
    if (!canSubmit || !catalogueId) return;
    setSubmitting(true);
    try {
      const data = await apiClient.post<{ order: OrderDetail }>('/api/orders', {
        catalogue_id: catalogueId,
        qty_xs: sizes.xs,
        qty_s: sizes.s,
        qty_m: sizes.m,
        qty_l: sizes.l,
        qty_xl: sizes.xl,
        notes: notes.trim() || undefined,
      });
      router.replace(`/orders/${data.order.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await logout();
        return;
      }
      if (err instanceof ApiError && err.reason === 'catalogue_closed') {
        Alert.alert('Catalogue closed', 'This catalogue just sold out.', [
          { text: 'OK', onPress: () => router.replace('/catalogues') },
        ]);
        return;
      }
      if (err instanceof ApiError && err.reason === 'duplicate_order') {
        Alert.alert('Already ordered', "You've already placed an order on this catalogue.", [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }
      Alert.alert('Something went wrong', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.designGrid}>
        {catalogue.designs.map((design) => (
          <DesignTile key={design.id} design={design} />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>QUANTITY PER SIZE</Text>
        <Text style={styles.sectionHint}>
          Applies to every design in this catalogue — {catalogue.number_of_designs}{' '}
          {catalogue.number_of_designs === 1 ? 'design' : 'designs'}.
        </Text>
        <QuantityStepperRow sizes={sizes} onChange={handleChange} />
      </View>

      <QuoteSummary quote={quote} hint={hint} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>NOTES (OPTIONAL)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Add a note for this order"
          placeholderTextColor={Colors.textTertiary}
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </View>

      <Pressable
        style={({ pressed }) => [styles.submitButton, (!canSubmit || pressed) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!canSubmit}>
        {submitting ? (
          <ActivityIndicator color={Colors.surface} />
        ) : (
          <Text style={styles.submitButtonText}>Place Order</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

function QuoteSummary({ quote, hint }: { quote: QuoteState; hint: number | null }) {
  if (quote.status === 'idle') {
    return (
      <View style={styles.quoteCard}>
        <Text style={styles.quoteHint}>Enter a quantity to see your order total.</Text>
      </View>
    );
  }

  if (quote.status === 'loading') {
    return (
      <View style={styles.quoteCard}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );
  }

  if (quote.status === 'error') {
    return (
      <View style={styles.quoteCard}>
        <Text style={styles.quoteHint}>{quote.error.message}</Text>
      </View>
    );
  }

  const { quote: data } = quote;

  return (
    <View style={styles.quoteCard}>
      <View style={styles.summaryRow}>
        <Text style={styles.quoteLabel}>Pieces per design</Text>
        <Text style={styles.quoteValue}>{data.pieces_per_design}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.quoteLabel}>Total pieces</Text>
        <Text style={styles.quoteValue}>{data.total_pieces}</Text>
      </View>
      <View style={[styles.summaryRow, styles.totalRow]}>
        <Text style={styles.quoteTotalLabel}>Order total</Text>
        <Text style={styles.quoteTotal}>{formatCurrency(data.total_amount)}</Text>
      </View>
      {data.uses_discount ? (
        <View style={styles.discountBadge}>
          <Text style={styles.discountBadgeText}>Bulk discount applied</Text>
        </View>
      ) : hint != null && hint > 0 ? (
        <Text style={styles.quoteHint}>
          Add {hint} more {hint === 1 ? 'piece' : 'pieces'} per design for a better price.
        </Text>
      ) : null}
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
  designGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: Typography.weightSemibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sectionHint: {
    fontSize: 13,
    fontWeight: Typography.weightRegular,
    color: Colors.textTertiary,
    marginTop: -Spacing.xs,
  },
  quoteCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'stretch',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.sm,
  },
  quoteLabel: {
    fontSize: 14,
    fontWeight: Typography.weightRegular,
    color: Colors.textSecondary,
  },
  quoteValue: {
    fontSize: 14,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
  },
  quoteTotalLabel: {
    fontSize: 15,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
  },
  quoteTotal: {
    fontSize: 20,
    fontWeight: Typography.weightBold,
    color: Colors.textPrimary,
  },
  quoteHint: {
    fontSize: 13,
    fontWeight: Typography.weightRegular,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  discountBadge: {
    backgroundColor: StatusColors.dispatched.bg,
    borderRadius: Radius.pill,
    paddingVertical: 6,
    alignItems: 'center',
  },
  discountBadgeText: {
    fontSize: 13,
    fontWeight: Typography.weightSemibold,
    color: StatusColors.dispatched.text,
  },
  notesInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: Typography.weightRegular,
    color: Colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: Typography.weightSemibold,
  },
});
