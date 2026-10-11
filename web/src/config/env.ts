/**
 * Public (browser-safe) configuration. Only `NEXT_PUBLIC_*` variables may be read
 * here — Next.js inlines them into the client bundle at build time, which is also
 * why each one must be referenced literally (no dynamic `process.env[key]`).
 *
 * Server-only secrets live in `./server-env.ts`.
 */

const DEFAULT_API_URL = "http://localhost:8000/api/v1";

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

const apiUrl = stripTrailingSlash(process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL);

export const env = {
  /** Backend REST base URL, e.g. https://api.example.com/api/v1 */
  apiUrl,
  /** Origin for the Socket.IO gateway (the API URL without its /api/vN suffix). */
  socketOrigin: apiUrl.replace(/\/api\/v\d+$/, ""),
  appName: process.env.NEXT_PUBLIC_APP_NAME || "JBIT Campus ERP",
} as const;
