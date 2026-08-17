import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useRef } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';

import { AnnouncementCard } from '@/components/announcement-card';
import { EmptyView, ErrorView, LoadingView } from '@/components/state-views';
import { Colors, Spacing } from '@/constants/theme';
import { Announcement } from '@/lib/types';
import { useApiQuery } from '@/lib/use-api-query';

export default function AnnouncementsScreen() {
  const router = useRouter();
  const { state, refreshing, refetch, onRefresh } = useApiQuery<{ announcements: Announcement[] }>(
    '/api/announcements'
  );

  // Refetch whenever this screen regains focus (e.g. back from a detail
  // screen that just marked one read) so the unread dot clears without a
  // manual pull-to-refresh. Skips the very first focus — useApiQuery's own
  // effect already fetches on mount, so firing here too would double the
  // request on every initial load.
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

  if (state.status === 'loading') return <LoadingView />;

  if (state.status === 'error') {
    return <ErrorView message={state.error.message} onRetry={refetch} />;
  }

  const { announcements } = state.data;

  if (announcements.length === 0) {
    return (
      <FlatList
        data={[]}
        renderItem={() => null}
        ListEmptyComponent={<EmptyView message="No announcements yet." />}
        contentContainerStyle={styles.emptyContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
      />
    );
  }

  return (
    <FlatList
      data={announcements}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <AnnouncementCard announcement={item} onPress={() => router.push(`/announcements/${item.id}`)} />
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
