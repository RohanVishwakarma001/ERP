import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session";

const API_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const isProd = process.env.NODE_ENV === "production";

function clearSessionCookies(res: NextResponse) {
  res.cookies.delete(ACCESS_COOKIE);
  res.cookies.delete(REFRESH_COOKIE);
  return res;
}

// Called on every app boot/hard-reload to silently re-derive a short-lived access
// token (held in memory only by the client) from the httpOnly refresh-token cookie.
export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ message: "No active session." }, { status: 401 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ message: "Unable to reach the authentication service." }, { status: 502 });
  }

  const payload = await backendRes.json().catch(() => null);
  if (!backendRes.ok || !payload) {
    return clearSessionCookies(NextResponse.json({ message: "Session expired." }, { status: 401 }));
  }

  const data = payload.data ?? payload;
  const { accessToken, refreshToken: rotatedRefreshToken, user } = data ?? {};
  if (!accessToken || !user) {
    return clearSessionCookies(NextResponse.json({ message: "Malformed refresh response." }, { status: 502 }));
  }

  const res = NextResponse.json({ user, accessToken });
  res.cookies.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  });
  if (rotatedRefreshToken) {
    res.cookies.set(REFRESH_COOKIE, rotatedRefreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
  }
  return res;
}
