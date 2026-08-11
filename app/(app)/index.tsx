import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

export default function HomeScreen() {
  const { customer, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Welcome, {customer?.name}</Text>
      <Pressable onPress={logout} hitSlop={8}>
        {({ pressed }) => <Text style={[styles.signOut, pressed && styles.signOutPressed]}>Sign out</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: Spacing.lg,
  },
  greeting: {
    fontSize: 22,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
  },
  signOut: {
    fontSize: 15,
    fontWeight: Typography.weightMedium,
    color: Colors.accent,
  },
  signOutPressed: {
    opacity: 0.6,
  },
});
