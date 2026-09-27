import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

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
  baseURL: API_BASE_URL,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Platform': Platform.OS,
  },
});

apiClient.interceptors.request.use(async (config) => {
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
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

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
          }>(`${API_BASE_URL}/auth/refresh`, { refreshToken });

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
