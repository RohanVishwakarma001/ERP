import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { env } from '@/config/env';
import { STORAGE_KEYS, secureStorage } from '@/lib/secure-storage';
import { toApiError } from './api-error';

type RetryableConfig = InternalAxiosRequestConfig & { _authRetried?: boolean; _transientRetried?: boolean };

const TRANSIENT_RETRY_DELAY_MS = 2500;

/** Listeners notified when the session can't be refreshed (the auth store signs out). */
const sessionExpiredListeners = new Set<() => void>();
export function onSessionExpired(listener: () => void) {
  sessionExpiredListeners.add(listener);
  return () => sessionExpiredListeners.delete(listener);
}

/**
 * Axios instance for all app → backend calls.
 * - Attaches the stored access token.
 * - Unwraps the backend's `{ success, data }` envelope.
 * - Retries once on a transient failure (network blip, 503, cold-start 401).
 * - On 401, rotates the token pair with the stored refresh token and retries once.
 * - Rejects with a normalized `ApiError`.
 */
export const httpClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json', 'X-Client-Platform': Platform.OS },
});

httpClient.interceptors.request.use(async (config) => {
  const token = await secureStorage.get(STORAGE_KEYS.accessToken);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await secureStorage.get(STORAGE_KEYS.refreshToken);
  if (!refreshToken) return null;
  try {
    // A bare axios call: going through httpClient would recurse into this interceptor.
    const res = await axios.post(`${env.apiUrl}/auth/refresh`, { refreshToken });
    const data = res.data?.data ?? res.data;
    if (!data?.accessToken) return null;
    await secureStorage.set(STORAGE_KEYS.accessToken, data.accessToken);
    if (data.refreshToken) await secureStorage.set(STORAGE_KEYS.refreshToken, data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

function isTransient(error: AxiosError): boolean {
  if (!error.response) return true;
  if (error.response.status === 503) return true;
  const message = (error.response.data as { error?: { message?: string } } | undefined)?.error?.message;
  return error.response.status === 401 && /temporarily/i.test(message ?? '');
}

function unwrapEnvelope(response: AxiosResponse): AxiosResponse {
  const body = response.data;
  if (body && typeof body === 'object' && body.success === true && 'data' in body) {
    return { ...response, data: body.data };
  }
  return response;
}

async function recover(error: AxiosError): Promise<AxiosResponse> {
  const config = error.config as RetryableConfig | undefined;
  if (!config) throw toApiError(error);

  if (isTransient(error) && !config._transientRetried) {
    config._transientRetried = true;
    await new Promise((resolve) => setTimeout(resolve, TRANSIENT_RETRY_DELAY_MS));
    return httpClient(config);
  }

  if (error.response?.status === 401 && !config._authRetried && !config.url?.startsWith('/auth/')) {
    config._authRetried = true;
    refreshInFlight ??= refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
    const token = await refreshInFlight;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      return httpClient(config);
    }
    await secureStorage.clearSession();
    sessionExpiredListeners.forEach((listener) => listener());
  }

  throw toApiError(error);
}

httpClient.interceptors.response.use(unwrapEnvelope, recover);
