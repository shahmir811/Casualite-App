import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GuestDesignTile } from '@/components/guest-design-tile';
import { DesignTileSkeleton, Skeleton } from '@/components/skeleton';
import { EmptyView, ErrorView } from '@/components/state-views';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { PublicCatalogueDetail } from '@/lib/types';
import { useApiQuery } from '@/lib/use-api-query';

// Read-only — no quantities, no pricing, no order button. Signing in is the
// only way to price or place an order (see app/(app)/(tabs)/catalogues/[id].tsx
// for the real flow), matching the account-based/not-account-based split
// Guideline 5.1.1(v) asks for.
export default function CataloguePreviewDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const { state, refetch } = useApiQuery<{ catalogue: PublicCatalogueDetail }>(
    id ? `/api/public/catalogues/${id}` : null
  );

  if (state.status === 'loading') {
    return (
      <View style={styles.container}>
        <Skeleton width="100%" height={screenWidth * 1.1} radius={0} />
        <View style={[styles.designGrid, styles.designGridPadded]}>
          {Array.from({ length: 6 }).map((_, index) => (
            <DesignTileSkeleton key={index} />
          ))}
        </View>
      </View>
    );
  }

  if (state.status === 'error') {
    return <ErrorView message={state.error.message} onRetry={refetch} />;
  }

  const { catalogue } = state.data;

  if (catalogue.sold_out) {
    return <EmptyView icon="close-circle-outline" message="This catalogue is sold out." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{catalogue.name}</Text>
        <Text style={styles.subtitle}>
          {catalogue.number_of_designs} {catalogue.number_of_designs === 1 ? 'Design' : 'Designs'}
        </Text>

        <View style={styles.designGrid}>
          {catalogue.designs.map((design, index) => (
            <GuestDesignTile key={design.id} design={design} index={index} />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Pressable style={styles.signinButton} onPress={() => router.push('/login')}>
          <Text style={styles.signinButtonText}>Sign In to Order</Text>
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
    gap: Spacing.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: Typography.weightRegular,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  designGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  designGridPadded: {
    padding: Spacing.md,
  },
  footer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  signinButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signinButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: Typography.weightSemibold,
  },
});
