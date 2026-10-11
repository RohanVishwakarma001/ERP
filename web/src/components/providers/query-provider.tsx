"use client";

import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { toApiError, getErrorMessage } from "@/lib/api/api-error";
import { toast } from "@/lib/toast-store";

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      /** Set to suppress the automatic error toast (the caller renders the error itself). */
      silentError?: boolean;
    };
  }
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        // The HTTP client already retries transient failures once; don't retry 4xx at all.
        retry: (failureCount, error) => {
          const status = toApiError(error).status;
          return failureCount < 1 && (status === null || status >= 500);
        },
      },
    },
    // Every failed mutation surfaces a toast unless it opts out with `meta: { silentError: true }`.
    mutationCache: new MutationCache({
      onError: (error, _vars, _ctx, mutation) => {
        if (!mutation.meta?.silentError) toast.error(getErrorMessage(error));
      },
    }),
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
