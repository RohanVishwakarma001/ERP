"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { LoginCredentials, User } from "@/types";
import { authApi } from "./api";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Owns the signed-in user for the whole app. The session is restored once on
 * boot (from the httpOnly refresh cookie), not on every page navigation.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<{ status: AuthStatus; user: User | null }>({ status: "loading", user: null });

  useEffect(() => {
    let cancelled = false;
    authApi.restoreSession().then((user) => {
      if (!cancelled) setState({ status: user ? "authenticated" : "unauthenticated", user });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const user = await authApi.login(credentials);
    setState({ status: "authenticated", user });
    return user;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    // Drop every cached response so the next user never sees the previous user's data.
    queryClient.clear();
    setState({ status: "unauthenticated", user: null });
  }, [queryClient]);

  const value = useMemo(() => ({ ...state, login, logout }), [state, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>.");
  return context;
}
