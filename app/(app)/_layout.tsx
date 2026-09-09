import { Drawer } from 'expo-router/drawer';

import { AppDrawerContent } from '@/components/app-drawer-content';

// Replaces the old flat Stack. (tabs) carries the 4 bottom-tab roots (Home,
// Catalogues, Orders, Account), each with its own nested stack for detail
// screens. announcements and settings are drawer-only destinations with no
// tab of their own — see components/app-drawer-content.tsx for the full nav
// list and components/screen-header.tsx for their in-screen back header.
export default function AppLayout() {
  return (
    <Drawer
      screenOptions={{ headerShown: false, drawerType: 'front', overlayColor: 'rgba(12,21,18,0.4)' }}
      drawerContent={(props) => <AppDrawerContent {...props} />}>
      <Drawer.Screen name="(tabs)" />
      <Drawer.Screen name="announcements" />
      <Drawer.Screen name="settings" />
    </Drawer>
  );
}
