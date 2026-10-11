import { AxiosError, isAxiosError } from 'axios';

/** Mirrors the backend's error envelope: `{ success: false, error: { code, message, details } }`. */
interface BackendErrorBody {
  error?: { code?: string; message?: string; details?: unknown };
  message?: string | string[];
}

/** Normalized error thrown by every API call. Only `message` is meant for users. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly code: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const FALLBACK_MESSAGES: Record<number, string> = {
  401: 'Your session has expired. Please sign in again.',
  403: "You don't have permission to do that.",
  404: 'The requested record was not found.',
  429: 'Too many requests. Please wait a moment and try again.',
  503: 'The service is temporarily unavailable. Please retry shortly.',
};

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (isAxiosError(error)) {
    const axiosError = error as AxiosError<BackendErrorBody>;
    if (!axiosError.response) {
      return new ApiError('Unable to reach the JBIT server. Check your network connection.', null, 'NETWORK_ERROR');
    }
    const { status, data } = axiosError.response;
    const raw = data?.error?.message ?? data?.message;
    const message = (Array.isArray(raw) ? raw[0] : raw) || FALLBACK_MESSAGES[status] || 'Something went wrong.';
    return new ApiError(message, status, data?.error?.code ?? `HTTP_${status}`);
  }
  if (error instanceof Error) return new ApiError(error.message, null, 'CLIENT_ERROR');
  return new ApiError('Something went wrong.', null, 'UNKNOWN');
}

export const getErrorMessage = (error: unknown) => toApiError(error).message;
