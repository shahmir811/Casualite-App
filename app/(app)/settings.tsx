import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

export default function SettingsScreen() {
  const { logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    Notifications.getPermissionsAsync().then(({ status }) => {
      setNotificationsEnabled(status === 'granted');
    });
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.group}>
        <SettingsRow
          icon="notifications-outline"
          label="Notifications"
          value={notificationsEnabled == null ? undefined : notificationsEnabled ? 'Enabled' : 'Disabled'}
          onPress={() => Linking.openSettings()}
        />
        <View style={styles.divider} />
        <SettingsRow
          icon="information-circle-outline"
          label="App Version"
          value={Constants.expoConfig?.version ?? '—'}
        />
      </View>

      <View style={styles.group}>
        <SettingsRow icon="log-out-outline" label="Sign Out" onPress={logout} />
      </View>
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  const row = (
    <>
      <Ionicons name={icon} size={20} color={Colors.accent} />
      <Text style={styles.label}>{label}</Text>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {onPress ? <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} /> : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{row}</View>;
  }

  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={onPress}>
      {row}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.md,
    gap: Spacing.lg,
  },
  group: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  rowPressed: {
    backgroundColor: Colors.surfacePressed,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: Spacing.md + 20 + Spacing.sm,
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: Typography.weightMedium,
    color: Colors.textPrimary,
  },
  value: {
    fontSize: 15,
    fontWeight: Typography.weightRegular,
    color: Colors.textTertiary,
  },
});
