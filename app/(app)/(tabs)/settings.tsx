import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/screen-header';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useNotification } from '@/lib/notification-context';

export default function SettingsScreen() {
  const { logout, deleteAccount } = useAuth();
  const { notify } = useNotification();
  const navigation = useNavigation();
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = () => {
    notify({
      title: 'Delete Account',
      message:
        'This permanently deletes your account and signs you out everywhere. Your order history stays with Casualite for their records, but you will no longer be able to sign in. This cannot be undone.',
      variant: 'error',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteAccount();
            } catch (err) {
              notify({
                title: 'Could not delete account',
                message: err instanceof Error ? err.message : 'Please try again.',
                variant: 'error',
              });
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    });
  };

  useEffect(() => {
    Notifications.getPermissionsAsync().then(({ status }) => {
      setNotificationsEnabled(status === 'granted');
    });
  }, []);

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Settings" onLeftPress={() => navigation.dispatch(DrawerActions.openDrawer())} />
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

      <View style={styles.group}>
        <SettingsRow
          icon="trash-outline"
          label={deleting ? 'Deleting…' : 'Delete Account'}
          onPress={deleting ? undefined : handleDeleteAccount}
          destructive
        />
      </View>
      </View>
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  destructive,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
}) {
  const row = (
    <>
      <Ionicons name={icon} size={20} color={destructive ? Colors.error : Colors.accent} />
      <Text style={[styles.label, destructive && styles.labelDestructive]}>{label}</Text>
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
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
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
  labelDestructive: {
    color: Colors.error,
  },
  value: {
    fontSize: 15,
    fontWeight: Typography.weightRegular,
    color: Colors.textTertiary,
  },
});
