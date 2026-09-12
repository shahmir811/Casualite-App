import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { formatRelativeTime } from '@/lib/format';
import { clampAspectRatio } from '@/lib/image';
import { Announcement } from '@/lib/types';

export function AnnouncementCard({ announcement, onPress }: { announcement: Announcement; onPress: () => void }) {
  const isUnread = announcement.read_at === null;
  const image = announcement.image_urls?.[0] ?? announcement.image_url;
  // Starts at the old fixed ratio as a loading placeholder, then locks to the
  // image's real proportions once known — see lib/image.ts for why a portrait
  // upload was previously getting cropped to fit a hardcoded 16:9 box.
  const [aspectRatio, setAspectRatio] = useState(16 / 9);

  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={onPress}>
      <View style={isUnread ? styles.unreadDot : styles.unreadDotSpacer} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.title, isUnread && styles.titleUnread]} numberOfLines={1}>
            {announcement.title}
          </Text>
          <Text style={styles.time}>{formatRelativeTime(announcement.sent_at)}</Text>
        </View>
        <Text style={styles.body} numberOfLines={4}>
          {announcement.body}
        </Text>
        {announcement.has_audio ? (
          <View style={styles.audioBadge}>
            <Ionicons name="mic" size={13} color={Colors.textTertiary} />
            <Text style={styles.audioBadgeText}>Voice message</Text>
          </View>
        ) : null}
        {image ? (
          <Image
            source={{ uri: image }}
            style={[styles.image, { aspectRatio }]}
            contentFit="contain"
            onLoad={(event) => {
              const { width, height } = event.source;
              if (width && height) {
                setAspectRatio(clampAspectRatio(width / height));
              }
            }}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    backgroundColor: Colors.surface,
  },
  rowPressed: {
    backgroundColor: Colors.surfacePressed,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    marginTop: 7,
  },
  unreadDotSpacer: {
    width: 8,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  title: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: Typography.weightMedium,
    color: Colors.textPrimary,
  },
  titleUnread: {
    fontWeight: Typography.weightSemibold,
  },
  time: {
    fontSize: 13,
    fontWeight: Typography.weightRegular,
    color: Colors.textTertiary,
  },
  body: {
    fontSize: 15,
    fontWeight: Typography.weightRegular,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  audioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  audioBadgeText: {
    fontSize: 13,
    fontWeight: Typography.weightRegular,
    color: Colors.textTertiary,
  },
  image: {
    width: '100%',
    borderRadius: Radius.card,
    backgroundColor: Colors.divider,
    marginTop: 4,
  },
});
