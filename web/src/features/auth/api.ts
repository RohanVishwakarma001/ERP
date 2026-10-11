import type { LoginCredentials, User } from "@/types";
import { httpClient } from "@/lib/api/http-client";
import { ApiError } from "@/lib/api/api-error";
import { tokenStore } from "@/lib/auth/token-store";

interface SessionPayload {
  user: User;
  accessToken: string;
}

/** Calls one of our own /api/auth/* route handlers (which manage the httpOnly cookies). */
async function postSessionRoute(path: string, body?: unknown): Promise<SessionPayload> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Unable to reach the server. Check your connection and try again.", null, "NETWORK_ERROR");
  }
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(payload?.message || "Request failed.", res.status, `HTTP_${res.status}`);
  return payload as SessionPayload;
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<User> {
    const { user, accessToken } = await postSessionRoute("/api/auth/login", credentials);
    tokenStore.set(accessToken);
    return user;
  },

  /** Re-derives an in-memory access token from the httpOnly refresh cookie. `null` when signed out. */
  async restoreSession(): Promise<User | null> {
    try {
      const { user, accessToken } = await postSessionRoute("/api/auth/refresh");
      tokenStore.set(accessToken);
      return user;
    } catch {
      tokenStore.set(null);
      return null;
    }
  },

  async logout(): Promise<void> {
    tokenStore.set(null);
    await postSessionRoute("/api/auth/logout").catch(() => undefined);
  },

  async forgotPassword(identifier: string): Promise<{ message: string }> {
    return (await httpClient.post("/auth/forgot-password", { identifier })).data;
  },

  async resetPassword(identifier: string, otp: string, newPassword: string): Promise<{ message: string }> {
    return (await httpClient.post("/auth/reset-password", { identifier, otp, newPassword })).data;
  },
};
