import { User, LoginCredentials, AuthResponse } from "@/types";
import { apiClient } from "./api-client";

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const res = await apiClient.post<any>("/auth/login", {
      identifier: credentials.identifier,
      password: credentials.password,
    });
    const data = res.data;
    const token = data?.accessToken || data?.token;
    const refreshToken = data?.refreshToken;
    const user = data?.user;

    if (!token || !user) {
      throw new Error("Invalid response received from authentication node.");
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("jbit_auth_token", token);
      if (refreshToken) localStorage.setItem("jbit_auth_refresh", refreshToken);
      localStorage.setItem("jbit_auth_user", JSON.stringify(user));
    }

    return {
      user,
      token,
      refreshToken,
    };
  },

  async verifyOtp(otp: string): Promise<boolean> {
    const res = await apiClient.post<{ success: boolean }>("/auth/verify-otp", { otp });
    return res.data?.success ?? false;
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.post<{ success: boolean; message: string }>("/auth/forgot-password", { email });
    return res.data;
  },

  async resetPassword(password: string): Promise<{ success: boolean }> {
    const res = await apiClient.post<{ success: boolean }>("/auth/reset-password", { password });
    return res.data;
  },

  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("jbit_auth_token");
      localStorage.removeItem("jbit_auth_refresh");
      localStorage.removeItem("jbit_auth_user");
    }
  },

  getCurrentUser(): User | null {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem("jbit_auth_user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  setCurrentUser(user: User): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("jbit_auth_user", JSON.stringify(user));
    }
  },
};
