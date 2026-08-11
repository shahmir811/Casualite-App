import { useCallback, useEffect, useState } from 'react';

import { apiClient, ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

type QueryState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError | Error }
  | { status: 'success'; data: T };

// Shared loading/loaded/failed handling for the read-only screens in this
// slice. A 401 is treated the same way everywhere: clear the stored token
// and fall back to the login screen, same convention as the initial /api/me
// check in AuthContext.
export function useApiQuery<T>(path: string | null) {
  const { logout } = useAuth();
  const [state, setState] = useState<QueryState<T>>({ status: 'loading' });
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(
    async (isRefresh: boolean) => {
      if (!path) return;
      if (isRefresh) setRefreshing(true);
      else setState({ status: 'loading' });

      try {
        const data = await apiClient.get<T>(path);
        setState({ status: 'success', data });
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          await logout();
          return;
        }
        setState({ status: 'error', error: err instanceof Error ? err : new Error('Something went wrong.') });
      } finally {
        if (isRefresh) setRefreshing(false);
      }
    },
    [path, logout]
  );

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  return {
    state,
    refreshing,
    refetch: () => fetchData(false),
    onRefresh: () => fetchData(true),
  };
}
