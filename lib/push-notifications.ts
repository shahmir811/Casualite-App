import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { apiClient } from '@/lib/api-client';

// Expo doesn't show a system alert for a notification that arrives while the
// app is in the foreground unless a handler opts in explicitly. Set once at
// module load, which runs before anything else touches this file.
//
// Accept the server's absolute unread count on arrival. In the background,
// iOS applies the push payload's badge itself without running this handler.
// The fetched announcement count reconciles it when the app is opened.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Sets the app icon badge to the given count. Call with the real unread
// count whenever it's known (e.g. after fetching announcements), not as an
// increment/decrement, so the number on the icon always matches what's
// actually unread.
export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (err) {
    console.warn('[push] Failed to set badge count', err);
  }
}

// Tracked so logout can unregister the exact token this device last
// registered, without re-deriving it.
let currentPushToken: string | null = null;

// Development-only evidence for iOS alerts that arrive silently. Never log
// tokens, message text, or customer data.
async function logIosNotificationDiagnostics(
  permissions: Notifications.NotificationPermissionsStatus
): Promise<void> {
  if (!__DEV__ || Platform.OS !== 'ios') return;

  try {
    const presented = await Notifications.getPresentedNotificationsAsync();
    console.info('[push] iOS notification diagnostics', JSON.stringify({
      authorizationStatus: permissions.ios?.status,
      allowsSound: permissions.ios?.allowsSound,
      allowsBadge: permissions.ios?.allowsBadge,
      notifications: presented.slice(-3).map(({ request }) => ({
        sound: request.content.sound,
        badge: request.content.badge,
        interruptionLevel: 'interruptionLevel' in request.content
          ? request.content.interruptionLevel
          : undefined,
      })),
    }));
  } catch (err) {
    console.warn('[push] Could not inspect iOS notification settings', err);
  }
}

function getProjectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

async function fetchAndRegisterToken(): Promise<void> {
  const projectId = getProjectId();
  if (!projectId) {
    // No EAS project is linked yet (app.json has no extra.eas.projectId).
    // getExpoPushTokenAsync requires it, so there's nothing to register
    // until `eas init` has been run once — see CLAUDE.md status notes.
    console.warn('[push] No EAS project ID configured — skipping push token registration.');
    return;
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    currentPushToken = token;
    await apiClient.post('/api/push-tokens', {
      token,
      platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : undefined,
    });
  } catch (err) {
    console.warn('[push] Failed to register push token', err);
  }
}

// Called right after a successful, interactive login. Only prompts when the
// user has never been asked before — an existing "denied" is respected and
// not re-prompted.
export async function requestPushPermissionAndRegister(): Promise<void> {
  if (Platform.OS === 'web') return;

  const { status } = await Notifications.getPermissionsAsync();
  let finalStatus = status;
  if (status === 'undetermined') {
    const result = await Notifications.requestPermissionsAsync();
    finalStatus = result.status;
  }
  if (finalStatus !== 'granted') return;

  await fetchAndRegisterToken();
}

// Called on cold start (once a session is restored) and app foreground.
// Never prompts — only re-registers when permission was already granted.
// Expo push tokens can occasionally rotate, and re-registering is a cheap
// upsert, so this is safe to call often.
export async function syncPushTokenIfGranted(): Promise<void> {
  if (Platform.OS === 'web') return;

  const permissions = await Notifications.getPermissionsAsync();
  void logIosNotificationDiagnostics(permissions);
  const { status } = permissions;
  if (status !== 'granted') return;

  await fetchAndRegisterToken();
}

// Called before clearing the auth token on logout. Matters most for shared
// devices — without this the outgoing customer keeps getting pushes until
// someone else's token overwrites theirs on the backend.
export async function unregisterPushToken(): Promise<void> {
  if (!currentPushToken) return;
  const token = currentPushToken;
  currentPushToken = null;

  try {
    await apiClient.delete('/api/push-tokens', { token });
  } catch (err) {
    console.warn('[push] Failed to unregister push token', err);
  }
}
