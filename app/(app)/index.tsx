import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { Announcement } from '@/lib/types';
import { useApiQuery } from '@/lib/use-api-query';

export default function HomeScreen() {
  const { customer } = useAuth();
  const router = useRouter();

  // Reuses the same unpaginated endpoint the Announcements screen fetches —
  // "any unread" is just a client-side check over the full list, so no
  // dedicated unread-count endpoint is needed.
  const { state, refetch } = useApiQuery<{ announcements: Announcement[] }>('/api/announcements');
  const hasUnread = state.status === 'success' && state.data.announcements.some((a) => a.read_at === null);

  // Refetch on regaining focus (e.g. back from Announcements after reading)
  // and skip the very first focus — the mount effect inside useApiQuery
  // already fires that request.
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

  // Home stays mounted underneath whatever screen is pushed on top of it, so
  // this also catches a push notification arriving while the app was
  // backgrounded — same AppState pattern used for push-token resync in
  // app/_layout.tsx.
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        refetch();
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, [refetch]);

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Welcome, {customer?.name}</Text>

      <View style={styles.nav}>
        <NavRow icon="pricetags-outline" label="Browse Catalogues" onPress={() => router.push('/catalogues')} />
        <View style={styles.navDivider} />
        <NavRow icon="receipt-outline" label="My Orders" onPress={() => router.push('/orders')} />
        <View style={styles.navDivider} />
        <NavRow icon="wallet-outline" label="Account & Ledger" onPress={() => router.push('/ledger')} />
        <View style={styles.navDivider} />
        <NavRow
          icon="megaphone-outline"
          label="Announcements"
          onPress={() => router.push('/announcements')}
          showDot={hasUnread}
        />
        <View style={styles.navDivider} />
        <NavRow icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} />
      </View>
    </View>
  );
}

function NavRow({
  icon,
  label,
  onPress,
  showDot,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  showDot?: boolean;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.navRow, pressed && styles.navRowPressed]} onPress={onPress}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={20} color={Colors.accent} />
        {showDot ? <View style={styles.dot} /> : null}
      </View>
      <Text style={styles.navLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: Spacing.lg,
    padding: Spacing.lg,
  },
  greeting: {
    fontSize: 22,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
  },
  nav: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  navRowPressed: {
    backgroundColor: Colors.surfacePressed,
  },
  iconWrap: {
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Colors.accent,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  navDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: Spacing.md + 20 + Spacing.sm,
  },
  navLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: Typography.weightMedium,
    color: Colors.textPrimary,
  },
});
