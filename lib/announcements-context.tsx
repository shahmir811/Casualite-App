import * as Notifications from 'expo-notifications';
import { createContext, ReactNode, useContext, useEffect, useMemo, useRef } from 'react';
import { AppState } from 'react-native';

import { Announcement } from '@/lib/types';
import { useApiQuery } from '@/lib/use-api-query';

type AnnouncementsData = { announcements: Announcement[] };

type AnnouncementsContextValue = ReturnType<typeof useApiQuery<AnnouncementsData>> & {
  unreadCount: number;
};

const AnnouncementsContext = createContext<AnnouncementsContextValue | null>(null);

// Single source of truth for the announcements list and its unread count —
// previously the Home bell fetched and filtered this list on its own with no
// way for the drawer's Notifications row (or the list/detail screens) to see
// the same number, so two places could show two different counts. Mounted
// once per signed-in session (see app/(app)/_layout.tsx) and consumed
// wherever an unread count or the announcements list is needed.
export function AnnouncementsProvider({ children }: { children: ReactNode }) {
  const query = useApiQuery<AnnouncementsData>('/api/announcements');
  const { state, refetch } = query;

  const unreadCount = useMemo(
    () => (state.status === 'success' ? state.data.announcements.filter((a) => a.read_at === null).length : 0),
    [state]
  );

  // A push arriving while the app is already in the foreground doesn't fire
  // the AppState 'active' transition below, so without this the unread count
  // (and every badge reading it) would stay stale until the next manual
  // refresh.
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(() => refetch());
    return () => subscription.remove();
  }, [refetch]);

  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        refetch();
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, [refetch]);

  const value = useMemo(() => ({ ...query, unreadCount }), [query, unreadCount]);

  return <AnnouncementsContext.Provider value={value}>{children}</AnnouncementsContext.Provider>;
}

export function useAnnouncements() {
  const ctx = useContext(AnnouncementsContext);
  if (!ctx) {
    throw new Error('useAnnouncements must be used within an AnnouncementsProvider');
  }
  return ctx;
}
