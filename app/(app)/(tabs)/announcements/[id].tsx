import { useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AudioMessagePlayer } from '@/components/audio-message-player';
import { Skeleton } from '@/components/skeleton';
import { EmptyView, ErrorView } from '@/components/state-views';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { apiClient } from '@/lib/api-client';
import { formatDateTime } from '@/lib/format';
import { clampAspectRatio } from '@/lib/image';
import { useAnnouncements } from '@/lib/announcements-context';

export default function AnnouncementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // No GET /api/announcements/{id} endpoint exists — the list already
  // carries full title/body/image, so this re-uses the same shared list
  // query (lib/announcements-context.tsx) and finds the one row. Works
  // identically whether opened from the list or from a cold-start push tap.
  const { state, refetch } = useAnnouncements();

  const announcement = state.status === 'success' ? state.data.announcements.find((a) => a.id === id) : undefined;

  const markedRead = useRef(false);
  useEffect(() => {
    if (!announcement || announcement.read_at || markedRead.current) return;
    markedRead.current = true;
    apiClient
      .post(`/api/announcements/${announcement.id}/read`)
      // Refetch the shared state so Home's bell and the drawer's badge drop
      // by one immediately, rather than waiting for the next push/foreground
      // trigger. Best-effort on failure — a network error shouldn't block
      // content that's already on screen; the count just stays stale until
      // the next natural refresh.
      .then(() => refetch())
      .catch((err) => {
        console.warn('[announcements] Failed to mark as read', err);
      });
  }, [announcement, refetch]);

  if (state.status === 'loading') {
    return (
      <View style={styles.content}>
        <Skeleton width="100%" height={220} radius={0} />
        <View style={styles.section}>
          <Skeleton width="70%" height={22} radius={4} />
          <Skeleton width={100} height={13} radius={4} />
          <Skeleton width="100%" height={13} radius={4} style={{ marginTop: 4 }} />
          <Skeleton width="90%" height={13} radius={4} />
          <Skeleton width="60%" height={13} radius={4} />
        </View>
      </View>
    );
  }

  if (state.status === 'error') {
    return <ErrorView message={state.error.message} onRetry={refetch} />;
  }

  if (!announcement) {
    return <EmptyView icon="megaphone-outline" message="This announcement is no longer available." />;
  }

  const images = announcement.image_urls?.length
    ? announcement.image_urls
    : announcement.image_url
      ? [announcement.image_url]
      : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {images.length > 0 ? <ImageGallery images={images} /> : null}
      <View style={styles.section}>
        <Text style={styles.title}>{announcement.title}</Text>
        <Text style={styles.date}>{formatDateTime(announcement.sent_at)}</Text>
        {announcement.has_audio && announcement.audio_url ? (
          <AudioMessagePlayer uri={announcement.audio_url} />
        ) : null}
        <Text style={styles.body}>{announcement.body}</Text>
      </View>
    </ScrollView>
  );
}

function ImageGallery({ images }: { images: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const screenWidth = Dimensions.get('window').width;

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    setActiveIndex(index);
  };

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {images.map((uri) => (
          <GalleryImage key={uri} uri={uri} width={screenWidth} />
        ))}
      </ScrollView>
      {images.length > 1 ? (
        <View style={styles.dots}>
          {images.map((uri, index) => (
            <View key={uri} style={[styles.dot, index === activeIndex && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function GalleryImage({ uri, width }: { uri: string; width: number }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  // Starts at the old fixed ratio as a loading placeholder, then locks to the
  // image's real proportions once known — see lib/image.ts for why a portrait
  // upload was previously getting cropped to fit a hardcoded 16:9 box.
  const [aspectRatio, setAspectRatio] = useState(16 / 9);

  return (
    <View style={[styles.image, { width, aspectRatio }]}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        onLoad={(event) => {
          const { width: w, height: h } = event.source;
          if (w && h) {
            setAspectRatio(clampAspectRatio(w / h));
          }
          setStatus('loaded');
        }}
        onError={() => setStatus('error')}
      />
      {status === 'loading' ? (
        <View style={styles.imageOverlay}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      ) : null}
      {status === 'error' ? (
        <View style={styles.imageOverlay}>
          <Text style={styles.imageErrorText}>Couldn&apos;t load image</Text>
        </View>
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
    paddingBottom: Spacing.xl,
  },
  image: {
    backgroundColor: Colors.divider,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageErrorText: {
    fontSize: 13,
    fontWeight: Typography.weightRegular,
    color: Colors.textTertiary,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.divider,
  },
  dotActive: {
    backgroundColor: Colors.accent,
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
