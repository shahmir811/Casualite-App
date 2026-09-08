import { useMemo, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

/**
 * Shown after a staff member (admin/accountant/production_manager/creative_head)
 * signs in — this is the entire (staff) route group. It embeds the real
 * CasualiteOS website, already logged in via MobileLoginController::consume(),
 * so screen-by-screen visibility per role comes from the site's own Spatie
 * role middleware with no native UI of our own.
 *
 * Logging out inside the WebView only destroys the Laravel session and
 * redirects to /login — left alone, that would render the website's own
 * login form inside this screen. We intercept that navigation instead and
 * bounce back to the app's native login screen (via exitStaffSession, which
 * flips auth status and the Stack.Protected guard in app/_layout.tsx does
 * the rest — no manual router call needed here).
 */
export default function StaffWebViewScreen() {
  const { staffRedirectUrl, exitStaffSession } = useAuth();

  // Derived from the redirect_url's own origin rather than a second
  // hardcoded host, so this never drifts from whatever backend issued it.
  const loginUrl = useMemo(() => {
    if (!staffRedirectUrl) return null;
    try {
      return new URL('/login', staffRedirectUrl).toString();
    } catch {
      return null;
    }
  }, [staffRedirectUrl]);

  // Guards against the exitStaffSession call firing more than once if
  // several intercepted requests land before the status flip re-renders.
  const exiting = useRef(false);

  if (!staffRedirectUrl) {
    // Shouldn't happen — app/_layout.tsx only mounts this screen once
    // login() has set staffRedirectUrl — but leaves no dead end if it does.
    void exitStaffSession();
    return null;
  }

  // react-native-webview doesn't re-export its ShouldStartLoadRequest type
  // from the package root — only the `url` field is needed here.
  const handleShouldStartLoad = (request: { url: string }): boolean => {
    if (loginUrl && request.url.startsWith(loginUrl) && !exiting.current) {
      exiting.current = true;
      void exitStaffSession();
      return false;
    }
    return true;
  };

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: staffRedirectUrl }}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color={Colors.accent} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
