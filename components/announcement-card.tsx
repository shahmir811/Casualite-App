import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { formatDate } from '@/lib/format';
import { Announcement } from '@/lib/types';

export function AnnouncementCard({ announcement, onPress }: { announcement: Announcement; onPress: () => void }) {
  const isUnread = announcement.read_at === null;

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress}>
      <View style={styles.topRow}>
        {isUnread ? <View style={styles.unreadDot} /> : null}
        <Text style={[styles.title, isUnread && styles.titleUnread]} numberOfLines={1}>
          {announcement.title}
        </Text>
      </View>
      <Text style={styles.body} numberOfLines={2}>
        {announcement.body}
      </Text>
      <Text style={styles.date}>{formatDate(announcement.sent_at)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: 4,
  },
  cardPressed: {
    backgroundColor: Colors.surfacePressed,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  title: {
    fontSize: 16,
    fontWeight: Typography.weightMedium,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  titleUnread: {
    fontWeight: Typography.weightSemibold,
  },
  body: {
    fontSize: 14,
    fontWeight: Typography.weightRegular,
    color: Colors.textSecondary,
  },
  date: {
    fontSize: 13,
    fontWeight: Typography.weightRegular,
    color: Colors.textTertiary,
    marginTop: 2,
  },
});
