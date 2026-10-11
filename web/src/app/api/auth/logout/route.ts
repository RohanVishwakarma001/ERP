import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/lib/auth/session";
import { callBackendAuth, clearSessionCookies, errorResponse, isSameOriginRequest } from "@/lib/auth/backend-session";

/** Revokes the backend refresh tokens (best effort) and always clears the cookies. */
export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) return errorResponse(403, "Cross-site request rejected.");
  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value;
  if (accessToken) await callBackendAuth("/auth/logout", {}, accessToken);
  return clearSessionCookies(NextResponse.json({ success: true }));
}
