import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DesignGalleryViewer } from '@/components/design-gallery-viewer';
import { DesignTile } from '@/components/design-tile';
import { QuantityStepperRow } from '@/components/quantity-stepper-row';
import { DesignTileSkeleton, Skeleton } from '@/components/skeleton';
import { EmptyView, ErrorView } from '@/components/state-views';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { apiClient, ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency } from '@/lib/format';
import { useNotification } from '@/lib/notification-context';
import { CatalogueDetail, OrderDetail, SizeBreakdown } from '@/lib/types';
import { useApiQuery } from '@/lib/use-api-query';
import { QuoteState, useQuote } from '@/lib/use-quote';

const EMPTY_SIZES: SizeBreakdown = { xs: 0, s: 0, m: 0, l: 0, xl: 0 };

export default function CatalogueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { logout } = useAuth();
  const { notify } = useNotification();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const catalogueId = id ? Number(id) : null;

  const { state, refetch } = useApiQuery<{ catalogue: CatalogueDetail }>(id ? `/api/catalogues/${id}` : null);
  const [sizes, setSizes] = useState<SizeBreakdown>(EMPTY_SIZES);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [openingBook, setOpeningBook] = useState(false);

  const quote = useQuote(catalogueId, sizes);

  // Fetched on tap, never cached — the presigned S3 URL is only good for 10
  // minutes (see CLAUDE.md §6).
  const handleViewBook = async () => {
    if (!catalogueId || openingBook) return;
    setOpeningBook(true);
    try {
      const data = await apiClient.get<{ url: string }>(`/api/catalogues/${catalogueId}/book`);
      await WebBrowser.openBrowserAsync(data.url);
    } catch (err) {
      notify({
        title: 'Could not open catalog book',
        message: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    } finally {
      setOpeningBook(false);
    }
  };

  if (state.status === 'loading') {
    return (
      <View style={[styles.container, styles.content]}>
        <Skeleton width="100%" height={screenWidth * 1.1} radius={0} />
        <View style={styles.designGrid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <DesignTileSkeleton key={index} />
          ))}
        </View>
        <Skeleton width="100%" height={88} radius={Radius.card} />
      </View>
    );
  }

  if (state.status === 'error') {
    return <ErrorView message={state.error.message} onRetry={refetch} />;
  }

  const { catalogue } = state.data;

  // Both cases block a real order server-side, so there's no form to show —
  // same treatment as the web app's sold-out screen.
  if (catalogue.sold_out) {
    return <EmptyView icon="close-circle-outline" message="This catalogue is sold out." />;
  }
  if (catalogue.already_ordered) {
    return (
      <EmptyView icon="checkmark-circle-outline" message="You've already placed an order on this catalogue." />
    );
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
        notify({
          title: 'Catalogue closed',
          message: 'This catalogue just sold out.',
          variant: 'error',
          buttons: [{ text: 'OK', onPress: () => router.replace('/catalogues') }],
        });
        return;
      }
      if (err instanceof ApiError && err.reason === 'duplicate_order') {
        notify({
          title: 'Already ordered',
          message: "You've already placed an order on this catalogue.",
          variant: 'info',
          buttons: [{ text: 'OK', onPress: () => router.back() }],
        });
        return;
      }
      if (err instanceof ApiError && err.reason === 'customer_not_found') {
        // The account behind this session no longer matches a customer
        // record server-side — same recovery as a 401, since there's
        // nothing to retry into.
        notify({
          title: 'Account not found',
          message: "We couldn't find your account. Please sign in again.",
          variant: 'error',
          buttons: [{ text: 'OK', onPress: () => logout() }],
        });
        return;
      }
      notify({
        title: 'Something went wrong',
        message: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const heroHeight = screenWidth * 1.1;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: Spacing.sm + insets.bottom }}
      keyboardShouldPersistTaps="handled">
      <View style={[styles.hero, { height: heroHeight }]}>
        {catalogue.cover_photo_url ? (
          <Image
            source={{ uri: catalogue.cover_photo_url }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, styles.heroPlaceholder]}>
            <Ionicons name="image-outline" size={48} color={Colors.textTertiary} />
          </View>
        )}
        <View style={styles.heroScrim} pointerEvents="none">
          <View style={[styles.scrimBand, { height: '100%' }]} />
          <View style={[styles.scrimBand, { height: '75%' }]} />
          <View style={[styles.scrimBand, { height: '50%' }]} />
          <View style={[styles.scrimBand, { height: '25%' }]} />
        </View>
        <Text style={styles.heroTitle} numberOfLines={2}>
          {catalogue.name}
        </Text>
      </View>

      {catalogue.has_catalogue_book ? (
        <View style={styles.bookButtonWrap}>
          <Pressable
            style={({ pressed }) => [styles.bookButton, pressed && styles.bookButtonPressed]}
            onPress={handleViewBook}
            disabled={openingBook}>
            {openingBook ? (
              <ActivityIndicator size="small" color={Colors.accent} />
            ) : (
              <Ionicons name="book-outline" size={18} color={Colors.accent} />
            )}
            <Text style={styles.bookButtonText}>View Complete Catalogue</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.body}>
        <View style={styles.designsHeaderRow}>
          <Text style={styles.designsHeaderCount}>
            {catalogue.number_of_designs} {catalogue.number_of_designs === 1 ? 'Design' : 'Designs'}
          </Text>
          <Text style={styles.designsHeaderNote}>Complete set only</Text>
        </View>

        <View style={styles.designGrid}>
          {catalogue.designs.map((design, index) => (
            <DesignTile key={design.id} design={design} index={index} onPress={() => setViewerIndex(index)} />
          ))}
        </View>

        <DesignGalleryViewer
          visible={viewerIndex !== null}
          designs={catalogue.designs}
          initialIndex={viewerIndex ?? 0}
          onClose={() => setViewerIndex(null)}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QUANTITY PER SIZE</Text>
          <Text style={styles.sectionHint}>
            Applies to every design in this catalogue — {catalogue.number_of_designs}{' '}
            {catalogue.number_of_designs === 1 ? 'design' : 'designs'}.
          </Text>
          <QuantityStepperRow sizes={sizes} onChange={handleChange} />
        </View>

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

        <OrderFooter quote={quote} hint={hint} canSubmit={canSubmit} submitting={submitting} onSubmit={handleSubmit} />
      </View>
    </ScrollView>
  );
}

function OrderFooter({
  quote,
  hint,
  canSubmit,
  submitting,
  onSubmit,
}: {
  quote: QuoteState;
  hint: number | null;
  canSubmit: boolean;
  submitting: boolean;
  onSubmit: () => void;
}) {
  let message: string | null = null;
  let totalText = formatCurrency(0);
  let piecesText = '0 pieces (1 set)';

  if (quote.status === 'idle') {
    message = 'Enter a quantity to see your order total.';
  } else if (quote.status === 'error') {
    message = quote.error.message;
  } else if (quote.status === 'success') {
    const { quote: data } = quote;
    totalText = formatCurrency(data.total_amount);
    piecesText = `${data.total_pieces} ${data.total_pieces === 1 ? 'piece' : 'pieces'} (1 set)`;
    if (data.uses_discount) {
      message = 'Bulk discount applied';
    } else if (hint != null && hint > 0) {
      message = `Add ${hint} more ${hint === 1 ? 'piece' : 'pieces'} per design for a better price.`;
    }
  }

  return (
    <View style={styles.footer}>
      {message ? <Text style={styles.footerMessage}>{message}</Text> : null}
      <View style={styles.footerRow}>
        {quote.status === 'loading' ? (
          <ActivityIndicator color={Colors.accent} />
        ) : (
          <View>
            <Text style={styles.footerTotal}>{totalText}</Text>
            <Text style={styles.footerPieces}>{piecesText}</Text>
          </View>
        )}
        <Pressable
          style={({ pressed }) => [styles.footerButton, (!canSubmit || pressed) && styles.footerButtonDisabled]}
          onPress={onSubmit}
          disabled={!canSubmit}>
          {submitting ? (
            <ActivityIndicator color={Colors.surface} />
          ) : (
            <>
              <Text style={styles.footerButtonText}>Place Order</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.surface} />
            </>
          )}
        </Pressable>
      </View>
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
  hero: {
    width: '100%',
    backgroundColor: Colors.divider,
    justifyContent: 'flex-end',
  },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '22%',
  },
  // Four stacked translucent bands standing in for a gradient — no native
  // module required, so it works in Expo Go and in dev-client builds that
  // predate expo-linear-gradient's install without a native rebuild.
  scrimBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.brandBlack,
    opacity: 0.15,
  },
  heroTitle: {
    color: Colors.surface,
    fontSize: 24,
    fontWeight: Typography.weightBold,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  bookButtonWrap: {
    marginTop: -20,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    paddingVertical: 14,
    shadowColor: Colors.brandBlack,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  bookButtonPressed: {
    opacity: 0.7,
  },
  bookButtonText: {
    fontSize: 15,
    fontWeight: Typography.weightSemibold,
    color: Colors.accent,
  },
  body: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.lg,
  },
  designsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  designsHeaderCount: {
    fontSize: 17,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
  },
  designsHeaderNote: {
    fontSize: 13,
    fontWeight: Typography.weightRegular,
    color: Colors.textTertiary,
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
  footer: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.card,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  footerMessage: {
    fontSize: 12,
    fontWeight: Typography.weightRegular,
    color: Colors.textTertiary,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerTotal: {
    fontSize: 20,
    fontWeight: Typography.weightBold,
    color: Colors.textPrimary,
  },
  footerPieces: {
    fontSize: 13,
    fontWeight: Typography.weightRegular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.accent,
    borderRadius: Radius.pill,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
  },
  footerButtonDisabled: {
    opacity: 0.5,
  },
  footerButtonText: {
    color: Colors.surface,
    fontSize: 15,
    fontWeight: Typography.weightSemibold,
  },
});
