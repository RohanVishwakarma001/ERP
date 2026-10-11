import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, verifyAccessToken } from "@/lib/auth/session";
import { getDefaultDashboardPath, isPathAllowedForRole, isPublicPath } from "@/lib/auth/route-guards";

/**
 * Server-side route gate — the real security boundary for pages (the httpOnly
 * cookie can't be read or forged by client JS). DashboardLayout's client-side
 * check is a UX layer only. The backend independently authorizes every API call.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/" || isPublicPath(pathname)) return NextResponse.next();

  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  const session = token ? await verifyAccessToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!isPathAllowedForRole(session.role, pathname)) {
    return NextResponse.redirect(new URL(getDefaultDashboardPath(session.role), req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|assets).*)"],
};
