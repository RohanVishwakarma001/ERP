import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { env } from "@/config/env";
import { tokenStore } from "@/lib/auth/token-store";
import { toApiError } from "./api-error";

type RetryableConfig = InternalAxiosRequestConfig & { _authRetried?: boolean; _transientRetried?: boolean };

/** Delay before retrying a request that hit a cold-starting serverless database. */
const TRANSIENT_RETRY_DELAY_MS = 2500;

/**
 * Axios instance for all browser → backend calls.
 *
 * - Attaches the in-memory access token (never persisted; see token-store.ts).
 * - Unwraps the backend's `{ success, data }` envelope so callers get `data` directly.
 * - Retries once on a transient failure (network blip, 503, or a cold-start 401).
 * - On 401, silently refreshes the access token via the httpOnly-cookie route and retries once.
 * - Rejects with a normalized `ApiError` so UI code never inspects raw Axios errors.
 */
export const httpClient: AxiosInstance = axios.create({
  baseURL: env.apiUrl,
  headers: { "Content-Type": "application/json" },
  timeout: 20_000,
});

httpClient.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshInFlight: Promise<string | null> | null = null;

/** Exchanges the httpOnly refresh cookie for a new access token. Concurrent callers share one request. */
export function refreshAccessToken(): Promise<string | null> {
  refreshInFlight ??= fetch("/api/auth/refresh", { method: "POST" })
    .then(async (res) => {
      if (!res.ok) return null;
      const { accessToken } = (await res.json()) as { accessToken?: string };
      tokenStore.set(accessToken ?? null);
      return accessToken ?? null;
    })
    .catch(() => null)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

function isTransient(error: AxiosError): boolean {
  if (!error.response) return true;
  if (error.response.status === 503) return true;
  // The backend reports a DB wake-up during JWT validation as a distinct 401.
  const message = (error.response.data as { error?: { message?: string } } | undefined)?.error?.message;
  return error.response.status === 401 && /temporarily/i.test(message ?? "");
}

function unwrapEnvelope(response: AxiosResponse): AxiosResponse {
  const body = response.data;
  if (body && typeof body === "object" && body.success === true && "data" in body) {
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

  if (error.response?.status === 401 && !config._authRetried && !config.url?.startsWith("/auth/")) {
    config._authRetried = true;
    const token = await refreshAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      return httpClient(config);
    }
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      // This interceptor lives outside React, so the Next router isn't available. A full
      // navigation is wanted anyway: it drops every piece of the expired session's state.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/login?expired=true";
    }
  }

  throw toApiError(error);
}

httpClient.interceptors.response.use(unwrapEnvelope, recover);
