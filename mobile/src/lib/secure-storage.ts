import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/** Every persisted key in one place. */
export const STORAGE_KEYS = {
  accessToken: 'jbit_auth_token',
  refreshToken: 'jbit_auth_refresh',
  user: 'jbit_auth_user',
} as const;

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * Key-value storage backed by the OS keychain/keystore on native and
 * localStorage on web (Expo web builds). Failures are swallowed and treated as
 * "not found": storage can be unavailable (private browsing, locked keychain)
 * and that must never crash the app.
 */
export const secureStorage = {
  async get(key: StorageKey): Promise<string | null> {
    try {
      if (Platform.OS !== 'web') return await SecureStore.getItemAsync(key);
      return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },

  async set(key: StorageKey, value: string): Promise<void> {
    try {
      if (Platform.OS !== 'web') await SecureStore.setItemAsync(key, value);
      else if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
    } catch {
      // Non-fatal: the session simply won't survive an app restart.
    }
  },

  async remove(key: StorageKey): Promise<void> {
    try {
      if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(key);
      else if (typeof window !== 'undefined') window.localStorage.removeItem(key);
    } catch {
      // Non-fatal.
    }
  },

  /** Removes every session key. */
  async clearSession(): Promise<void> {
    await Promise.all(Object.values(STORAGE_KEYS).map((key) => secureStorage.remove(key)));
  },
};
