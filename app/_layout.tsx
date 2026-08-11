import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { syncPushTokenIfGranted } from '@/lib/push-notifications';

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
      <StatusBar style="dark" />
    </AuthProvider>
  );
}

function RootNavigator() {
  const { status } = useAuth();
  const router = useRouter();

  // Tap-to-deep-link: notification data carries an order_id, and every push
  // points at the existing order-detail screen — no new screen needed.
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { order_id?: number | string };
      if (data.order_id != null) {
        router.push(`/orders/${data.order_id}`);
      }
    });
    return () => subscription.remove();
  }, [router]);

  // Expo push tokens can occasionally rotate — re-sync (silently, no
  // permission prompt) whenever the app comes back to the foreground.
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active' && status === 'authenticated') {
        void syncPushTokenIfGranted();
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, [status]);

  if (status === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={status === 'authenticated'}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'unauthenticated'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
