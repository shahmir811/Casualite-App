import { Stack } from 'expo-router';

import { DetailBackButton } from '@/components/detail-back-button';
import { detailHeaderOptions } from '@/lib/navigation-headers';

export default function CataloguesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="[id]"
        options={{
          ...detailHeaderOptions,
          title: 'New Order',
          headerLeft: () => <DetailBackButton fallbackHref="/catalogues" />,
        }}
      />
    </Stack>
  );
}
