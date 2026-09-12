import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Colors, Typography } from '@/constants/theme';

const MAX_DISPLAY = 99;

// Numeric unread-count pill, shared by the Home bell and the drawer's
// Notifications row so both read the same visual convention.
export function UnreadBadge({ count, style }: { count: number; style?: StyleProp<ViewStyle> }) {
  if (count <= 0) return null;
  const label = count > MAX_DISPLAY ? `${MAX_DISPLAY}+` : String(count);

  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.text} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: Typography.weightBold,
    color: '#FFFFFF',
  },
});
