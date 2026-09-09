import { Stack } from 'expo-router';

import { detailHeaderOptions } from '@/lib/navigation-headers';

export default function OrdersLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" options={{ ...detailHeaderOptions, title: 'Order Details' }} />
    </Stack>
  );
}
