import { Drawer } from 'expo-router/drawer';

import { AppDrawerContent } from '@/components/app-drawer-content';
import { AnnouncementsProvider } from '@/lib/announcements-context';

// Replaces the old flat Stack. (tabs) carries the 4 bottom-tab roots (Home,
// Catalogues, Orders, Account) plus two drawer-only destinations that ride
// along inside the same navigator instead of sitting beside it —
// announcements and settings — registered as href: null Tabs.Screen entries
// in (tabs)/_layout.tsx so they keep the bottom tab bar and hamburger header
// like every other tab root, without getting a tab bar button of their own.
// See components/app-drawer-content.tsx for the full nav list and
// components/screen-header.tsx for the shared hamburger header.
//
// AnnouncementsProvider wraps the whole group (not just the announcements
// screens) because the unread count is also shown on Home's bell and the
// drawer's Notifications row — every consumer needs to be inside it.
export default function AppLayout() {
  return (
    <AnnouncementsProvider>
      <Drawer
        screenOptions={{ headerShown: false, drawerType: 'front', overlayColor: 'rgba(12,21,18,0.4)' }}
        drawerContent={(props) => <AppDrawerContent {...props} />}>
        <Drawer.Screen name="(tabs)" />
      </Drawer>
    </AnnouncementsProvider>
  );
}
