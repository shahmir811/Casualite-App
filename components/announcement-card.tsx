import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { formatRelativeTime } from '@/lib/format';
import { Announcement } from '@/lib/types';

export function AnnouncementCard({ announcement, onPress }: { announcement: Announcement; onPress: () => void }) {
  const isUnread = announcement.read_at === null;
  const image = announcement.image_urls?.[0] ?? announcement.image_url;

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
        {image ? <Image source={{ uri: image }} style={styles.image} contentFit="cover" /> : null}
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
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: Radius.card,
    backgroundColor: Colors.divider,
    marginTop: 4,
  },
});
