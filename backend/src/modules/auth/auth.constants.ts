/**
 * Token and OTP lifetimes. The web app's session cookies (web/src/lib/auth/cookies.ts)
 * use the same durations — change both together.
 */
export const ACCESS_TOKEN_TTL = '15m';
export const REFRESH_TOKEN_TTL = '7d';
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

export const BCRYPT_ROUNDS_TOKEN = 10;
export const BCRYPT_ROUNDS_PASSWORD = 12;

/** The only JWT algorithm the API issues or accepts — blocks `alg` confusion/`none` attacks. */
export const JWT_ALGORITHM = 'HS256' as const;
