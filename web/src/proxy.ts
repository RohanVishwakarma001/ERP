import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, verifyAccessToken } from "@/lib/session";
import { isPathAllowedForRole, getDefaultDashboardPath } from "@/lib/route-guards";
import { UserRole } from "@/types";

const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password", "/403"];

// Server-side route gate: this is the actual security boundary (the httpOnly cookie
// cannot be read or forged by client JS). DashboardLayout's client-side check is a
// secondary UX layer only — it must never be relied on as the real guard.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/" || PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  const session = token ? await verifyAccessToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.role as UserRole;
  if (!isPathAllowedForRole(role, pathname)) {
    return NextResponse.redirect(new URL(getDefaultDashboardPath(role), req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|assets).*)"],
};
