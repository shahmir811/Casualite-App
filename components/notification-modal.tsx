import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing, StatusColors, Typography } from '@/constants/theme';
import { NotificationButton, NotificationOptions, NotificationVariant } from '@/lib/notification-context';

// Colors borrowed from tokens already in the app (StatusColors chip tints,
// Colors.success/error) rather than inventing new ones — same palette the
// order-status chips use for green/red, just repurposed for a dialog icon.
const VARIANT: Record<NotificationVariant, { icon: keyof typeof Ionicons.glyphMap; iconColor: string; iconBg: string }> = {
  success: { icon: 'checkmark-circle', iconColor: Colors.success, iconBg: StatusColors.dispatched.bg },
  error: { icon: 'close-circle', iconColor: Colors.error, iconBg: StatusColors.cancelled.bg },
  info: { icon: 'information-circle', iconColor: Colors.accent, iconBg: Colors.surfacePressed },
};

function buttonStyle(style: NotificationButton['style']) {
  if (style === 'cancel') return styles.buttonSecondary;
  if (style === 'destructive') return styles.buttonDestructive;
  return styles.buttonPrimary;
}

function buttonTextStyle(style: NotificationButton['style']) {
  if (style === 'cancel') return styles.buttonSecondaryText;
  if (style === 'destructive') return styles.buttonDestructiveText;
  return styles.buttonPrimaryText;
}

export function NotificationModal({
  notification,
  onDismiss,
}: {
  notification: NotificationOptions | null;
  onDismiss: (button: NotificationButton) => void;
}) {
  const visible = notification !== null;
  const variant = VARIANT[notification?.variant ?? 'info'];
  const buttons = notification?.buttons ?? [{ text: 'OK' }];

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: variant.iconBg }]}>
            <Ionicons name={variant.icon} size={28} color={variant.iconColor} />
          </View>

          <Text style={styles.title}>{notification?.title}</Text>
          {notification?.message ? <Text style={styles.message}>{notification.message}</Text> : null}

          <View style={[styles.buttonRow, buttons.length > 2 && styles.buttonColumn]}>
            {buttons.map((button, index) => (
              <Pressable
                key={`${button.text}-${index}`}
                style={({ pressed }) => [styles.button, buttonStyle(button.style), pressed && styles.buttonPressed]}
                onPress={() => onDismiss(button)}>
                <Text style={buttonTextStyle(button.style)}>{button.text}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 17,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontWeight: Typography.weightRegular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
    marginTop: Spacing.sm,
  },
  buttonColumn: {
    flexDirection: 'column',
  },
  button: {
    flex: 1,
    borderRadius: Radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonPrimary: {
    backgroundColor: Colors.accent,
  },
  buttonPrimaryText: {
    color: Colors.surface,
    fontSize: 15,
    fontWeight: Typography.weightSemibold,
  },
  buttonSecondary: {
    backgroundColor: Colors.surfacePressed,
  },
  buttonSecondaryText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: Typography.weightSemibold,
  },
  buttonDestructive: {
    backgroundColor: Colors.surfacePressed,
  },
  buttonDestructiveText: {
    color: Colors.error,
    fontSize: 15,
    fontWeight: Typography.weightSemibold,
  },
});
