import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Resolves the host development machine IP address when running inside Expo Go or native dev runtime
 */
export function getDevHostIp(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost;

  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return ip;
    }
  }

  const experienceUrl = (Constants as any).experienceUrl as string | undefined;
  if (experienceUrl) {
    try {
      const match = experienceUrl.match(/:\/\/([^:/]+)/);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
        return match[1];
      }
    } catch {
      // Ignore URL parsing errors
    }
  }

  return null;
}

/**
 * Dynamically determines the active API base URL.
 * - Web: uses localhost or EXPO_PUBLIC_API_URL
 * - Native Mobile: if env specifies localhost or 127.0.0.1, auto-replaces with host machine LAN IP so Expo Go on physical phones or emulators can reach the backend server!
 */
export function getApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  // On Web, localhost works directly
  if (Platform.OS === 'web') {
    return envUrl || 'http://localhost:8000/api/v1';
  }

  // If a real non-localhost URL is provided in .env (e.g. direct LAN IP or production domain)
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  // Detect Expo Go / Metro host machine IP dynamically
  const devHost = getDevHostIp();
  if (devHost) {
    return `http://${devHost}:8000/api/v1`;
  }

  // Android emulator loopback fallback to host machine
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api/v1';
  }

  return envUrl || 'http://localhost:8000/api/v1';
}

// Token Storage Helper with safe platform detection
export const storageHelper = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS !== 'web') {
        return await SecureStore.getItemAsync(key);
      } else if (typeof window !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch {
      return null;
    }
    return null;
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(key, value);
      } else if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch {
      // Safe fallback
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(key);
      } else if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch {
      // Safe fallback
    }
  },
};

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Platform': Platform.OS,
  },
});

apiClient.interceptors.request.use(async (config) => {
  const currentBase = getApiBaseUrl();
  if (!config.baseURL || config.baseURL.includes('localhost') || config.baseURL.includes('127.0.0.1')) {
    config.baseURL = currentBase;
  }
  const token = await storageHelper.getItem('jbit_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor with auto-unwrapping and 401 token refresh retry
apiClient.interceptors.response.use(
  (response) => {
    // Automatically unwrap standard backend envelope
    if (
      response.data &&
      typeof response.data === 'object' &&
      response.data.success === true &&
      'data' in response.data
    ) {
      return {
        ...response,
        data: response.data.data,
      };
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _transientRetry?: boolean;
    };

    // A serverless Postgres instance (Neon) that has scaled to zero after being idle
    // takes several seconds to wake on the next query — this surfaces as a network
    // timeout, a 503 from the backend's DB-connectivity guard, or (if it happens mid
    // JWT validation) a 401 with a specific "temporarily" message rather than a real
    // invalid-token 401. Retry once after a short delay instead of failing the
    // user's very first request of a session.
    const isTransientDbWakeup =
      !error.response ||
      error.response.status === 503 ||
      (error.response.status === 401 &&
        typeof (error.response.data as any)?.error?.message === 'string' &&
        (error.response.data as any).error.message.toLowerCase().includes('temporarily'));

    if (isTransientDbWakeup && originalRequest && !originalRequest._transientRetry) {
      originalRequest._transientRetry = true;
      await new Promise((resolve) => setTimeout(resolve, 2500));
      return apiClient(originalRequest);
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await storageHelper.getItem('jbit_auth_refresh');
        if (refreshToken) {
          // Attempt refresh token exchange with backend
          const refreshRes = await axios.post<{
            success?: boolean;
            data?: { accessToken: string; refreshToken?: string };
            accessToken?: string;
          }>(`${getApiBaseUrl()}/auth/refresh`, { refreshToken });

          const newAccessToken =
            refreshRes.data?.data?.accessToken || refreshRes.data?.accessToken;
          const newRefreshToken = refreshRes.data?.data?.refreshToken;

          if (newAccessToken) {
            await storageHelper.setItem('jbit_auth_token', newAccessToken);
            if (newRefreshToken) {
              await storageHelper.setItem('jbit_auth_refresh', newRefreshToken);
            }
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          }
        }
      } catch {
        // Refresh failed: wipe session
      }

      // If refresh failed or unavailable, purge session
      await storageHelper.removeItem('jbit_auth_token');
      await storageHelper.removeItem('jbit_auth_refresh');
      await storageHelper.removeItem('jbit_auth_user');
      await storageHelper.removeItem('jbit_auth_role');
    }

    return Promise.reject(error);
  }
);
