import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

// Only used where no bespoke skeleton exists for the screen's shape —
// prefer a Skeleton composite from components/skeleton.tsx when one fits.
export function LoadingView() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={Colors.accent} />
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.message}>{message}</Text>
      <Pressable style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]} onPress={onRetry}>
        <Text style={styles.retryText}>Try again</Text>
      </Pressable>
    </View>
  );
}

export function EmptyView({
  message,
  icon = 'ellipse-outline',
}: {
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.center}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={28} color={Colors.textTertiary} />
      </View>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfacePressed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 15,
    fontWeight: Typography.weightRegular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
  },
  retryButtonPressed: {
    opacity: 0.7,
  },
  retryText: {
    color: Colors.surface,
    fontSize: 15,
    fontWeight: Typography.weightSemibold,
  },
});
