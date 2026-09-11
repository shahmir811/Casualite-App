import { Ionicons } from '@expo/vector-icons';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { DrawerActions } from '@react-navigation/native';
import { Href, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UnreadBadge } from '@/components/unread-badge';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAnnouncements } from '@/lib/announcements-context';
import { useAuth } from '@/lib/auth-context';

// One flat list covering every destination in the app, not just the 4 tab
// roots — this is what replaces Home's old in-page "Browse Catalogues / My
// Orders / Account & Ledger / Settings" row stack (see (tabs)/index.tsx),
// which was the "back and forth" pattern the owner asked us to remove.
const ITEMS: { icon: keyof typeof Ionicons.glyphMap; label: string; href: Href }[] = [
  { icon: 'home-outline', label: 'Home', href: '/' },
  { icon: 'pricetags-outline', label: 'Browse Catalogues', href: '/catalogues' },
  { icon: 'receipt-outline', label: 'My Orders', href: '/orders' },
  { icon: 'wallet-outline', label: 'Account & Ledger', href: '/account' },
  { icon: 'notifications-outline', label: 'Notifications', href: '/announcements' },
  { icon: 'settings-outline', label: 'Settings', href: '/settings' },
];

export function AppDrawerContent(props: DrawerContentComponentProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { customer, logout } = useAuth();
  const { unreadCount } = useAnnouncements();

  const go = (href: Href) => {
    props.navigation.dispatch(DrawerActions.closeDrawer());
    router.push(href);
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.lg },
      ]}>
      <View style={styles.header}>
        <Text style={styles.wordmark}>CASUALITE</Text>
        <Pressable hitSlop={8} onPress={() => props.navigation.dispatch(DrawerActions.closeDrawer())}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </Pressable>
      </View>

      {customer ? (
        <View style={styles.profile}>
          <Text style={styles.profileName} numberOfLines={1}>
            {customer.name}
          </Text>
          <Text style={styles.profileMeta} numberOfLines={1}>
            {customer.email}
          </Text>
          <Text style={styles.profileMeta} numberOfLines={1}>
            {customer.city}
          </Text>
        </View>
      ) : null}

      <View style={styles.list}>
        {ITEMS.map((item) => (
          <Pressable
            key={item.label}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => go(item.href)}>
            <Ionicons name={item.icon} size={20} color={Colors.textPrimary} />
            <Text style={[styles.label, styles.labelFlex]}>{item.label}</Text>
            {item.href === '/announcements' ? <UnreadBadge count={unreadCount} /> : null}
            <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
          </Pressable>
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={() => {
          props.navigation.dispatch(DrawerActions.closeDrawer());
          logout();
        }}>
        <Ionicons name="log-out-outline" size={20} color={Colors.error} />
        <Text style={[styles.label, styles.signOutLabel]}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  wordmark: {
    fontSize: 17,
    fontWeight: Typography.weightSemibold,
    letterSpacing: 3,
    color: Colors.textPrimary,
  },
  profile: {
    gap: 2,
    paddingBottom: Spacing.lg,
    marginBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  profileName: {
    fontSize: 16,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
  },
  profileMeta: {
    fontSize: 13,
    fontWeight: Typography.weightRegular,
    color: Colors.textSecondary,
  },
  list: {
    flex: 1,
    gap: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.chip,
  },
  rowPressed: {
    backgroundColor: Colors.surfacePressed,
  },
  label: {
    fontSize: 16,
    fontWeight: Typography.weightMedium,
    color: Colors.textPrimary,
  },
  labelFlex: {
    flex: 1,
  },
  signOutLabel: {
    color: Colors.error,
  },
});
