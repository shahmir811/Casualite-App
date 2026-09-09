import { createContext, ReactNode, useCallback, useContext, useState } from 'react';

import { NotificationModal } from '@/components/notification-modal';

export type NotificationButtonStyle = 'default' | 'cancel' | 'destructive';

export type NotificationButton = {
  text: string;
  style?: NotificationButtonStyle;
  onPress?: () => void;
};

export type NotificationVariant = 'success' | 'error' | 'info';

export type NotificationOptions = {
  title: string;
  message?: string;
  variant?: NotificationVariant;
  buttons?: NotificationButton[];
};

type NotificationContextValue = {
  // Same shape as Alert.alert(title, message, buttons) so existing call
  // sites port over with a near mechanical find/replace, but rendered as a
  // single instance mounted once in app/_layout.tsx — it survives screen
  // navigation instead of being torn down with whichever screen raised it.
  notify: (options: NotificationOptions) => void;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<NotificationOptions | null>(null);

  const notify = useCallback((options: NotificationOptions) => {
    setCurrent(options);
  }, []);

  const handleDismiss = useCallback((button: NotificationButton) => {
    setCurrent(null);
    button.onPress?.();
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <NotificationModal notification={current} onDismiss={handleDismiss} />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}
