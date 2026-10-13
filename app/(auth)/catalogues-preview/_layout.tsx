import { Stack } from 'expo-router';

import { DetailBackButton } from '@/components/detail-back-button';
import { detailHeaderOptions } from '@/lib/navigation-headers';

export default function CataloguesPreviewLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="index"
        options={{
          ...detailHeaderOptions,
          title: 'Catalogues',
          headerLeft: () => <DetailBackButton fallbackHref="/" />,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          ...detailHeaderOptions,
          title: 'Catalogue',
          headerLeft: () => <DetailBackButton fallbackHref="/catalogues-preview" />,
        }}
      />
    </Stack>
  );
}
