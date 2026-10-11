type OriginCallback = (err: Error | null, allow?: boolean) => void;

/**
 * CORS origin check shared by the HTTP server and the WebSocket gateway.
 *
 * Reads `process.env` directly (not AppConfig) because the WebSocket gateway's
 * CORS options live in a decorator that is evaluated before DI exists. The env
 * has already been validated by ConfigModule by the time a request arrives.
 *
 * - Development: every origin is allowed (Expo Go, LAN IPs, emulators).
 * - Production: only WEB_URL and CORS_ORIGINS. Requests without an Origin header
 *   (native apps, curl, server-to-server) pass — CORS only governs browsers.
 */
export function corsOriginCheck(origin: string | undefined, callback: OriginCallback): void {
  if (process.env.NODE_ENV !== 'production') {
    callback(null, true);
    return;
  }

  const allowed = new Set(
    [process.env.WEB_URL, ...(process.env.CORS_ORIGINS ?? '').split(',')]
      .map((o) => o?.trim())
      .filter((o): o is string => Boolean(o)),
  );

  if (!origin || allowed.has(origin)) {
    callback(null, true);
  } else {
    callback(new Error(`Origin ${origin} is not permitted by CORS policy.`), false);
  }
}
