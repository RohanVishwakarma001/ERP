import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Short-lived, single-purpose links for downloading an admit card PDF from a plain
 * browser (e.g. the mobile app's in-app browser, which can't send a bearer token).
 *
 * The key is derived from the access-token secret with a fixed label, so a download
 * token can never verify as a session JWT (different format and different key), and
 * it only grants reading one admit card for a few minutes.
 */
export const DOWNLOAD_TOKEN_TTL_SECONDS = 5 * 60;

interface DownloadClaims {
  /** Admit card id. */
  aid: string;
  /** Requesting user id (for auditing). */
  sub: string;
  /** Expiry, seconds since epoch. */
  exp: number;
}

const derivedKey = (accessSecret: string) => createHmac('sha256', accessSecret).update('admit-card-download/v1').digest();
const sign = (payload: string, accessSecret: string) => createHmac('sha256', derivedKey(accessSecret)).update(payload).digest('base64url');

export function createDownloadToken(admitCardId: string, userId: string, accessSecret: string, now = Date.now()): string {
  const claims: DownloadClaims = { aid: admitCardId, sub: userId, exp: Math.floor(now / 1000) + DOWNLOAD_TOKEN_TTL_SECONDS };
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `${payload}.${sign(payload, accessSecret)}`;
}

/** Returns the claims, or null when the token is malformed, tampered with or expired. */
export function verifyDownloadToken(token: string, accessSecret: string, now = Date.now()): DownloadClaims | null {
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra !== undefined) return null;
  const expected = Buffer.from(sign(payload, accessSecret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as DownloadClaims;
    if (typeof claims.aid !== 'string' || typeof claims.exp !== 'number' || claims.exp * 1000 < now) return null;
    return claims;
  } catch {
    return null;
  }
}
