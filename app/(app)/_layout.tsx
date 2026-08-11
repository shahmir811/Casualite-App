import { Stack } from 'expo-router';

import { Colors, Typography } from '@/constants/theme';

// Shared with every pushed screen below — a plain object (not a nested Stack)
// so all of them live in this one navigator and get a working back button to
// Home. A nested Stack per subfolder treats its first screen as its own
// root, which drops the back history to whatever pushed into it.
const detailHeaderOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: Colors.surface },
  headerShadowVisible: false,
  headerTintColor: Colors.accent,
  headerTitleStyle: { color: Colors.textPrimary, fontWeight: Typography.weightSemibold },
  headerBackTitle: 'Back',
} as const;

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="orders/index" options={{ ...detailHeaderOptions, title: 'My Orders' }} />
      <Stack.Screen name="orders/[id]" options={{ ...detailHeaderOptions, title: 'Order Details' }} />
      <Stack.Screen name="ledger" options={{ ...detailHeaderOptions, title: 'Account' }} />
    </Stack>
  );
}
