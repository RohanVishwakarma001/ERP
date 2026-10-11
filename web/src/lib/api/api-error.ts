import { AxiosError, isAxiosError } from "axios";

/** Mirrors the backend's error envelope: `{ success: false, error: { code, message, details } }`. */
interface BackendErrorBody {
  success?: false;
  error?: { code?: string; message?: string; details?: unknown };
  message?: string | string[];
}

/**
 * Normalized error thrown by every API call. UI code should only ever need
 * `message` (safe to show users) and occasionally `status` / `code`.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly code: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isNetworkError() {
    return this.status === null;
  }
}

const FALLBACK_MESSAGES: Record<number, string> = {
  400: "The request was invalid.",
  401: "Your session has expired. Please sign in again.",
  403: "You don't have permission to do that.",
  404: "The requested record was not found.",
  409: "This conflicts with an existing record.",
  429: "Too many requests. Please wait a moment and try again.",
  503: "The service is temporarily unavailable. Please retry shortly.",
};

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (isAxiosError(error)) {
    const axiosError = error as AxiosError<BackendErrorBody>;
    if (!axiosError.response) {
      return new ApiError("Unable to reach the server. Check your connection and try again.", null, "NETWORK_ERROR");
    }
    const { status, data } = axiosError.response;
    const rawMessage = data?.error?.message ?? data?.message;
    const message =
      (Array.isArray(rawMessage) ? rawMessage[0] : rawMessage) || FALLBACK_MESSAGES[status] || "Something went wrong.";
    return new ApiError(message, status, data?.error?.code ?? `HTTP_${status}`, data?.error?.details);
  }

  if (error instanceof Error) return new ApiError(error.message, null, "CLIENT_ERROR");
  return new ApiError("Something went wrong.", null, "UNKNOWN");
}

/** User-presentable message for any thrown value. */
export function getErrorMessage(error: unknown): string {
  return toApiError(error).message;
}
