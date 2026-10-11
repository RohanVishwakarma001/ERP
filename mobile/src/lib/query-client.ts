import { Alert } from 'react-native';
import { MutationCache, QueryClient } from '@tanstack/react-query';
import { getErrorMessage, toApiError } from './api/api-error';

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      /** Suppress the automatic error alert (the screen shows the error itself). */
      silentError?: boolean;
    };
  }
}

/**
 * The single QueryClient for the app. Exported (not just provided) so the auth
 * store can clear every cached response on sign-out.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      // The HTTP client already retries transient failures once; never retry 4xx.
      retry: (failureCount, error) => {
        const status = toApiError(error).status;
        return failureCount < 1 && (status === null || status >= 500);
      },
    },
  },
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      if (!mutation.meta?.silentError) Alert.alert('Something went wrong', getErrorMessage(error));
    },
  }),
});
