import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

export default function HomeScreen() {
  const { customer } = useAuth();
  const router = useRouter();

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
        <NavRow icon="megaphone-outline" label="Announcements" onPress={() => router.push('/announcements')} />
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
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.navRow, pressed && styles.navRowPressed]} onPress={onPress}>
      <Ionicons name={icon} size={20} color={Colors.accent} />
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
