import { Stack } from 'expo-router';

import { detailHeaderOptions } from '@/lib/navigation-headers';

export default function AnnouncementsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" options={{ ...detailHeaderOptions, title: 'Announcement' }} />
    </Stack>
  );
}
