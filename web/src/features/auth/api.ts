import { User, LoginCredentials } from "@/types";
import { apiClient } from "./api-client";
import { tokenStore } from "./token-store";

const USER_CACHE_KEY = "jbit_session_user";

function cacheUser(user: User | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      // Display-only profile data (name/role/etc.) — never the token. Safe for
      // sessionStorage: per-tab, cleared on close, and gates nothing by itself
      // since proxy.ts independently verifies the real httpOnly cookie.
      sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(USER_CACHE_KEY);
    }
  } catch {
    // sessionStorage unavailable (private mode, etc.) — non-fatal.
  }
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<{ user: User }> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: credentials.identifier, password: credentials.password }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(payload?.message || "Invalid credentials.");
    }

    tokenStore.set(payload.accessToken);
    cacheUser(payload.user);
    return { user: payload.user };
  },

  /** Silently re-derives an access token from the httpOnly refresh cookie. Call once on app boot. */
  async restoreSession(): Promise<User | null> {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (!res.ok) {
        tokenStore.set(null);
        cacheUser(null);
        return null;
      }
      const payload = await res.json();
      tokenStore.set(payload.accessToken);
      cacheUser(payload.user);
      return payload.user;
    } catch {
      tokenStore.set(null);
      cacheUser(null);
      return null;
    }
  },

  async logout(): Promise<void> {
    tokenStore.set(null);
    cacheUser(null);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Cookies are httpOnly and best cleared server-side; client state is already reset.
    }
  },

  /** Synchronous, display-only cache — NOT a security boundary. See proxy.ts for the real gate. */
  getCurrentUser(): User | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(USER_CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async forgotPassword(identifier: string): Promise<{ message: string }> {
    const res = await apiClient.post<{ message: string }>("/auth/forgot-password", { identifier });
    return res.data;
  },

  async verifyOtp(identifier: string, otp: string): Promise<boolean> {
    try {
      await apiClient.post("/auth/verify-otp", { identifier, otp });
      return true;
    } catch {
      return false;
    }
  },

  async resetPassword(identifier: string, otp: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.post<{ success: boolean; message: string }>("/auth/reset-password", {
      identifier,
      otp,
      newPassword,
    });
    return res.data;
  },
};
