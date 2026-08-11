import * as SecureStore from 'expo-secure-store';

// Never AsyncStorage here — it's unencrypted. See CLAUDE.md §5.
const TOKEN_KEY = 'casualite_auth_token';

export function getStoredToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export function clearStoredToken() {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}
