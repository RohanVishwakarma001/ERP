import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { tokenStore } from "./token-store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Request interceptor to attach the in-memory JWT access token (never localStorage).
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStore.get();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: unwrap the backend's { success, data } envelope, and on a 401
// (expired access token) silently refresh once via the httpOnly-cookie-backed
// /api/auth/refresh route before failing the request out to the caller.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = fetch("/api/auth/refresh", { method: "POST" })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        tokenStore.set(data.accessToken ?? null);
        return data.accessToken ?? null;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      typeof response.data === "object" &&
      response.data.success === true &&
      "data" in response.data
    ) {
      return {
        ...response,
        data: response.data.data,
      };
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as { message?: string };

      if (status === 401 && originalRequest && !originalRequest._retried && !originalRequest.url?.includes("/auth/")) {
        originalRequest._retried = true;
        const newToken = await refreshAccessToken();
        if (newToken) {
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
        if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
          window.location.href = "/login?expired=true";
        }
      } else if (status === 403) {
        if (typeof window !== "undefined") {
          window.location.href = "/403";
        }
      } else if (status === 404) {
        console.warn("Resource not found:", error.config?.url);
      } else if (status === 422) {
        console.warn("Business validation error:", data?.message);
      } else if (status === 500) {
        console.error("Internal Server Error:", data?.message || "A server error occurred");
      }
    }
    return Promise.reject(error);
  }
);
