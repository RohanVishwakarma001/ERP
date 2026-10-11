import { NextRequest } from "next/server";
import { isSameOriginRequest, callBackendAuth, errorResponse, sessionResponse } from "@/lib/auth/backend-session";

/** Browser login entry point. Proxies to the backend and sets httpOnly session cookies. */
export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) return errorResponse(403, "Cross-site request rejected.");
  const body = (await req.json().catch(() => null)) as { identifier?: string; password?: string } | null;
  if (!body?.identifier || !body.password) {
    return errorResponse(400, "Identifier and password are required.");
  }

  const result = await callBackendAuth("/auth/login", { identifier: body.identifier, password: body.password });
  return result.ok ? sessionResponse(result.session) : errorResponse(result.status, result.message);
}
