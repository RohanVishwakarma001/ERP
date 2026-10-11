"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/features/auth/auth-provider";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "./query-provider";

/** All client-side providers, in dependency order. Mounted once by the root layout. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </QueryProvider>
  );
}
