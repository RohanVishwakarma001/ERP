import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/config/server-env";
import type { User } from "@/types";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "./session";

/**
 * Shared plumbing for the /api/auth/* route handlers, which proxy auth calls to
 * the backend server-to-server and keep the tokens in httpOnly cookies, so the
 * refresh token is never exposed to browser JavaScript.
 */

// Must match backend/src/modules/auth/auth.constants.ts.
const ACCESS_TOKEN_MAX_AGE_S = 15 * 60;
const REFRESH_TOKEN_MAX_AGE_S = 7 * 24 * 60 * 60;

export interface BackendSession {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

type BackendResult = { ok: true; session: BackendSession } | { ok: false; status: number; message: string };

/** POSTs to a backend auth endpoint and unwraps its `{ success, data }` / `{ error }` envelope. */
export async function callBackendAuth(path: string, body: unknown, accessToken?: string): Promise<BackendResult> {
  let res: Response;
  try {
    res = await fetch(`${serverEnv.apiInternalUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(body ?? {}),
      cache: "no-store",
    });
  } catch {
    return { ok: false, status: 502, message: "Unable to reach the authentication service." };
  }

  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload) {
    return { ok: false, status: res.status || 502, message: payload?.error?.message ?? "Authentication failed." };
  }

  const data = payload.data ?? payload;
  if (!data?.accessToken || !data?.user) {
    return { ok: false, status: 502, message: "Malformed authentication response." };
  }
  return { ok: true, session: data };
}

/** Responds with `{ user, accessToken }` and stores the tokens in httpOnly cookies. */
export function sessionResponse(session: BackendSession): NextResponse {
  const res = NextResponse.json({ user: session.user, accessToken: session.accessToken });
  const base = { httpOnly: true, secure: serverEnv.isProduction, sameSite: "lax" as const, path: "/" };
  res.cookies.set(ACCESS_COOKIE, session.accessToken, { ...base, maxAge: ACCESS_TOKEN_MAX_AGE_S });
  if (session.refreshToken) {
    res.cookies.set(REFRESH_COOKIE, session.refreshToken, { ...base, maxAge: REFRESH_TOKEN_MAX_AGE_S });
  }
  return res;
}

/**
 * CSRF guard for the cookie-authenticated /api/auth/* handlers. SameSite=Lax
 * already withholds cookies from cross-site POSTs; this also rejects any request
 * a browser marks as cross-site or whose Origin isn't this app, in case a cookie
 * policy is ever relaxed or a sibling subdomain is compromised.
 */
export function isSameOriginRequest(req: NextRequest): boolean {
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") return false;

  const origin = req.headers.get("origin");
  if (!origin) return fetchSite !== null; // modern browsers send one or the other
  return origin === req.nextUrl.origin;
}

export function errorResponse(status: number, message: string, clearCookies = false): NextResponse {
  const res = NextResponse.json({ message }, { status });
  if (clearCookies) clearSessionCookies(res);
  return res;
}

export function clearSessionCookies(res: NextResponse): NextResponse {
  res.cookies.delete(ACCESS_COOKIE);
  res.cookies.delete(REFRESH_COOKIE);
  return res;
}
