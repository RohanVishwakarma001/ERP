import { env } from "./env";

/**
 * Server-only configuration for Route Handlers and the proxy (middleware).
 * Importing this from a client component throws, so a secret can never be
 * bundled to the browser by accident.
 */
if (typeof window !== "undefined") {
  throw new Error("config/server-env must only be imported on the server.");
}

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`${name} is not set. Add it to web/.env.local (see web/.env.example).`);
  return value;
}

export const serverEnv = {
  isProduction: process.env.NODE_ENV === "production",
  /** URL the Next.js server uses to reach the backend (may be a private network address). */
  apiInternalUrl: (process.env.API_INTERNAL_URL || env.apiUrl).replace(/\/+$/, ""),
  /** Read lazily so a missing secret fails the request that needs it, not the whole build. */
  get jwtAccessSecret(): string {
    return required("JWT_ACCESS_SECRET", process.env.JWT_ACCESS_SECRET);
  },
};
