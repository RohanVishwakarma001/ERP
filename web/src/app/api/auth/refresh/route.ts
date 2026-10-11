import { NextRequest } from "next/server";
import { REFRESH_COOKIE } from "@/lib/auth/session";
import { isSameOriginRequest, callBackendAuth, errorResponse, sessionResponse } from "@/lib/auth/backend-session";

/**
 * Called on app boot and whenever an access token expires: exchanges the httpOnly
 * refresh cookie for a fresh (rotated) token pair.
 */
export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) return errorResponse(403, "Cross-site request rejected.");
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return errorResponse(401, "No active session.");

  const result = await callBackendAuth("/auth/refresh", { refreshToken });
  if (result.ok) return sessionResponse(result.session);
  // An unreachable backend is not an expired session — keep the cookies so the next attempt can succeed.
  if (result.status >= 500) return errorResponse(result.status, result.message);
  return errorResponse(401, "Session expired.", true);
}
