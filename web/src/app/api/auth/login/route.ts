import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session";

const API_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const isProd = process.env.NODE_ENV === "production";

// This Route Handler is the only place the browser's login form talks to. It proxies
// to the real backend server-to-server, then stores the resulting tokens in httpOnly
// cookies scoped to this web app's own domain — the backend's response never reaches
// the browser directly, so the refresh token is never exposed to client JS at all.
export async function POST(req: NextRequest) {
  let body: { identifier?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const { identifier, password } = body;
  if (!identifier || !password) {
    return NextResponse.json({ message: "Identifier and password are required." }, { status: 400 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ message: "Unable to reach the authentication service." }, { status: 502 });
  }

  const payload = await backendRes.json().catch(() => null);
  if (!backendRes.ok || !payload) {
    const message = payload?.error?.message || payload?.message || "Invalid credentials.";
    return NextResponse.json({ message }, { status: backendRes.status || 401 });
  }

  const data = payload.data ?? payload;
  const { accessToken, refreshToken, user } = data ?? {};
  if (!accessToken || !refreshToken || !user) {
    return NextResponse.json({ message: "Malformed authentication response." }, { status: 502 });
  }

  const res = NextResponse.json({ user, accessToken });
  res.cookies.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  });
  res.cookies.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  return res;
}
