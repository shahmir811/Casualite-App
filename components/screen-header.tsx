import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing, Typography } from '@/constants/theme';

// The in-screen header for every drawer-reachable root screen (the 4 tab
// roots use the hamburger variant to open the drawer; announcements/index
// and settings use the back-chevron variant, since they're drawer
// destinations with no tab bar of their own to fall back on — see
// components/app-drawer-content.tsx and lib/navigation-headers.ts for the
// pushed-screen equivalent).
export function ScreenHeader({
  title,
  leftIcon = 'menu-outline',
  onLeftPress,
  right,
}: {
  title: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  onLeftPress: () => void;
  right?: ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.row, { paddingTop: insets.top + Spacing.sm }]}>
      <Pressable
        hitSlop={8}
        style={({ pressed }) => [styles.iconWrap, pressed && styles.iconWrapPressed]}
        onPress={onLeftPress}>
        <Ionicons name={leftIcon} size={24} color={Colors.textPrimary} />
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  iconWrap: {
    padding: 4,
    borderRadius: 8,
  },
  iconWrapPressed: {
    backgroundColor: Colors.surfacePressed,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },
  right: {
    minWidth: 24,
    alignItems: 'flex-end',
  },
});
