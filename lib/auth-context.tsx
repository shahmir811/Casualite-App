import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import { apiClient, ApiError, setAuthToken } from '@/lib/api-client';
import { requestPushPermissionAndRegister, syncPushTokenIfGranted, unregisterPushToken } from '@/lib/push-notifications';
import { clearStoredToken, getStoredToken, setStoredToken } from '@/lib/secure-storage';
import { Customer } from '@/lib/types';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  status: AuthStatus;
  customer: Customer | null;
  login: (portalToken: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    (async () => {
      const token = await getStoredToken();
      if (!token) {
        setStatus('unauthenticated');
        return;
      }

      setAuthToken(token);
      try {
        const data = await apiClient.get<{ customer: Customer }>('/api/me');
        setCustomer(data.customer);
        setStatus('authenticated');
        // Cold start with a restored session — silently re-register if
        // permission was already granted. Never prompts here.
        void syncPushTokenIfGranted();
      } catch (err) {
        // Only a confirmed-invalid token gets wiped. A network failure here
        // just falls back to the login screen without discarding the token,
        // so the next launch can retry once connectivity is back.
        if (err instanceof ApiError && err.status === 401) {
          await clearStoredToken();
        }
        setAuthToken(null);
        setStatus('unauthenticated');
      }
    })();
  }, []);

  const login = useCallback(async (portalToken: string, email: string) => {
    const data = await apiClient.post<{ token: string; customer: Customer }>('/api/auth/verify', {
      portal_token: portalToken,
      email,
    });
    await setStoredToken(data.token);
    setAuthToken(data.token);
    setCustomer(data.customer);
    setStatus('authenticated');
    // Fresh interactive login — a reasonable moment to ask for permission.
    void requestPushPermissionAndRegister();
  }, []);

  const logout = useCallback(async () => {
    await unregisterPushToken();
    setAuthToken(null);
    await clearStoredToken();
    setCustomer(null);
    setStatus('unauthenticated');
  }, []);

  return <AuthContext.Provider value={{ status, customer, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
