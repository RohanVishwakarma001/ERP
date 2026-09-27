import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session";

const API_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function POST(req: NextRequest) {
  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value;
  if (accessToken) {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
    } catch {
      // Best-effort server-side revocation; cookies are cleared regardless.
    }
  }

  const res = NextResponse.json({ success: true });
  res.cookies.delete(ACCESS_COOKIE);
  res.cookies.delete(REFRESH_COOKIE);
  return res;
}
