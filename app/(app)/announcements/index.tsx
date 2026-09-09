import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useRef } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { AnnouncementCard } from '@/components/announcement-card';
import { ScreenHeader } from '@/components/screen-header';
import { AnnouncementRowSkeleton } from '@/components/skeleton';
import { EmptyView, ErrorView } from '@/components/state-views';
import { Colors } from '@/constants/theme';
import { Announcement } from '@/lib/types';
import { useApiQuery } from '@/lib/use-api-query';

export default function AnnouncementsScreen() {
  const router = useRouter();
  const { state, refreshing, refetch, onRefresh } = useApiQuery<{ announcements: Announcement[] }>(
    '/api/announcements'
  );

  const header = <ScreenHeader title="Notifications" leftIcon="chevron-back" onLeftPress={() => router.back()} />;

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

  if (state.status === 'loading') {
    return (
      <View style={styles.container}>
        {header}
        {Array.from({ length: 6 }).map((_, index) => (
          <AnnouncementRowSkeleton key={index} />
        ))}
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

  const { announcements } = state.data;

  if (announcements.length === 0) {
    return (
      <View style={styles.container}>
        {header}
        <FlatList
          data={[]}
          renderItem={() => null}
          ListEmptyComponent={<EmptyView icon="megaphone-outline" message="No announcements yet." />}
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
        data={announcements}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AnnouncementCard announcement={item} onPress={() => router.push(`/announcements/${item.id}`)} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.divider,
  },
  emptyContainer: {
    flexGrow: 1,
  },
});
