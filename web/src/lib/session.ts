import { jwtVerify } from "jose";

export const ACCESS_COOKIE = "jbit_access";
export const REFRESH_COOKIE = "jbit_refresh";

export interface SessionPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
}

function getAccessSecret(): Uint8Array {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not configured for the web app (see web/.env.local).");
  }
  return new TextEncoder().encode(secret);
}

/** Verifies the httpOnly access-token cookie server-side (middleware/route handlers only). */
export async function verifyAccessToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAccessSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
