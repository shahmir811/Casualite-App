import { useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyView, ErrorView, LoadingView } from '@/components/state-views';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { apiClient } from '@/lib/api-client';
import { formatDateTime } from '@/lib/format';
import { Announcement } from '@/lib/types';
import { useApiQuery } from '@/lib/use-api-query';

export default function AnnouncementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // No GET /api/announcements/{id} endpoint exists — the list already
  // carries full title/body/image, so this re-uses the same list query and
  // finds the one row. Works identically whether opened from the list or
  // from a cold-start push tap.
  const { state, refetch } = useApiQuery<{ announcements: Announcement[] }>('/api/announcements');

  const announcement = state.status === 'success' ? state.data.announcements.find((a) => a.id === id) : undefined;

  const markedRead = useRef(false);
  useEffect(() => {
    if (!announcement || announcement.read_at || markedRead.current) return;
    markedRead.current = true;
    // Best-effort — a network failure shouldn't block reading content
    // that's already on screen. The list screen refetches on return
    // regardless, so a failed mark-read here just means the dot lingers.
    apiClient.post(`/api/announcements/${announcement.id}/read`).catch((err) => {
      console.warn('[announcements] Failed to mark as read', err);
    });
  }, [announcement]);

  if (state.status === 'loading') return <LoadingView />;

  if (state.status === 'error') {
    return <ErrorView message={state.error.message} onRetry={refetch} />;
  }

  if (!announcement) {
    return <EmptyView message="This announcement is no longer available." />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {announcement.image_url ? (
        <Image source={{ uri: announcement.image_url }} style={styles.image} contentFit="cover" />
      ) : null}
      <View style={styles.section}>
        <Text style={styles.title}>{announcement.title}</Text>
        <Text style={styles.date}>{formatDateTime(announcement.sent_at)}</Text>
        <Text style={styles.body}>{announcement.body}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: Spacing.xl,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.divider,
  },
  section: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
  },
  date: {
    fontSize: 13,
    fontWeight: Typography.weightRegular,
    color: Colors.textTertiary,
  },
  body: {
    fontSize: 16,
    fontWeight: Typography.weightRegular,
    color: Colors.textPrimary,
    lineHeight: 24,
    marginTop: Spacing.xs,
  },
});
