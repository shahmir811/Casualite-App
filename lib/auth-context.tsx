import CookieManager from '@preeternal/react-native-cookie-manager';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import { apiClient, ApiError, setAuthToken } from '@/lib/api-client';
import {
  requestPushPermissionAndRegister,
  setBadgeCount,
  syncPushTokenIfGranted,
  unregisterPushToken,
} from '@/lib/push-notifications';
import { clearStoredToken, getStoredToken, setStoredToken } from '@/lib/secure-storage';
import { Customer, VerifyResponse } from '@/lib/types';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'staff';

type AuthContextValue = {
  status: AuthStatus;
  customer: Customer | null;
  staffRedirectUrl: string | null;
  login: (portalToken: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
  // Called by the (staff) WebView screen once it detects the staff member
  // has logged out of the website inside the WebView — returns the app to
  // its own native login screen instead of showing the website's login form.
  exitStaffSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [staffRedirectUrl, setStaffRedirectUrl] = useState<string | null>(null);

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
    const data = await apiClient.post<VerifyResponse>('/api/auth/verify', {
      portal_token: portalToken,
      email,
    });

    if (data.account_type === 'staff') {
      // No bearer token, no push registration — staff never touch another
      // /api/* endpoint, they're handed straight to the embedded WebView.
      setStaffRedirectUrl(data.redirect_url);
      setStatus('staff');
      return;
    }

    await setStoredToken(data.token);
    setAuthToken(data.token);
    setCustomer(data.customer);
    setStatus('authenticated');
    // Fresh interactive login — a reasonable moment to ask for permission.
    void requestPushPermissionAndRegister();
  }, []);

  const exitStaffSession = useCallback(async () => {
    // Clear the WebView's cookie jar so the next staff login on this device
    // — possibly a different staff member — never auto-resumes a stale
    // session before the fresh Auth::login() on the backend even runs.
    try {
      await CookieManager.clearAll();
    } catch (err) {
      console.warn('[auth] Failed to clear staff WebView cookies', err);
    }
    setStaffRedirectUrl(null);
    setStatus('unauthenticated');
  }, []);

  const logout = useCallback(async () => {
    await unregisterPushToken();
    // Best-effort — a network failure here shouldn't trap the customer in a
    // signed-in state. The token is cleared locally regardless; it just
    // stays valid server-side until it naturally goes unused.
    try {
      await apiClient.post('/api/auth/logout');
    } catch (err) {
      console.warn('[auth] Failed to revoke session token', err);
    }
    setAuthToken(null);
    await clearStoredToken();
    setCustomer(null);
    setStatus('unauthenticated');
    // Shared devices shouldn't carry one customer's unread count into the
    // next customer's session.
    void setBadgeCount(0);
  }, []);

  return (
    <AuthContext.Provider value={{ status, customer, staffRedirectUrl, login, logout, exitStaffSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
