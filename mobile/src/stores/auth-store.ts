import { create } from 'zustand';
import type { MobileUser } from '@/types';
import { httpClient, onSessionExpired } from '@/lib/api/http-client';
import { getErrorMessage, toApiError } from '@/lib/api/api-error';
import { STORAGE_KEYS, secureStorage } from '@/lib/secure-storage';
import { queryClient } from '@/lib/query-client';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: MobileUser | null;
  authStatus: AuthStatus;
  isLoggingIn: boolean;
  error: string | null;
  restoreSession: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: MobileUser;
}

const signedOut = { user: null, authStatus: 'unauthenticated' as const, isLoggingIn: false };

/**
 * Session state for the whole app. Tokens live in secure storage (never in this
 * store); the cached user lets the app open offline, and is refreshed from
 * /auth/me whenever the network is available.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  authStatus: 'loading',
  isLoggingIn: false,
  error: null,

  restoreSession: async () => {
    const [token, cachedUser] = await Promise.all([
      secureStorage.get(STORAGE_KEYS.accessToken),
      secureStorage.get(STORAGE_KEYS.user),
    ]);
    if (!token || !cachedUser) {
      set(signedOut);
      return;
    }

    let user: MobileUser;
    try {
      user = JSON.parse(cachedUser);
    } catch {
      await secureStorage.clearSession();
      set(signedOut);
      return;
    }

    try {
      // Confirms the session is still valid (the HTTP client refreshes it if needed).
      await httpClient.get('/auth/me');
      set({ user, authStatus: 'authenticated' });
    } catch (err) {
      if (toApiError(err).status === 401) {
        await secureStorage.clearSession();
        set(signedOut);
      } else {
        // Offline or server unreachable: keep the cached session and let screens show their own errors.
        set({ user, authStatus: 'authenticated' });
      }
    }
  },

  login: async (identifier, password) => {
    set({ isLoggingIn: true, error: null });
    try {
      const { data } = await httpClient.post<LoginResponse>('/auth/login', { identifier: identifier.trim(), password });
      await Promise.all([
        secureStorage.set(STORAGE_KEYS.accessToken, data.accessToken),
        secureStorage.set(STORAGE_KEYS.refreshToken, data.refreshToken),
        secureStorage.set(STORAGE_KEYS.user, JSON.stringify(data.user)),
      ]);
      set({ user: data.user, authStatus: 'authenticated', isLoggingIn: false });
      return true;
    } catch (err) {
      set({ isLoggingIn: false, error: getErrorMessage(err) });
      return false;
    }
  },

  logout: async () => {
    // Best effort: revoke refresh tokens server-side; local sign-out happens regardless.
    await httpClient.post('/auth/logout').catch(() => undefined);
    await secureStorage.clearSession();
    queryClient.clear();
    set({ ...signedOut, error: null });
  },

  clearError: () => set({ error: null }),
}));

// If the HTTP client can't refresh an expired session, sign the user out everywhere.
onSessionExpired(() => {
  queryClient.clear();
  useAuthStore.setState(signedOut);
});
