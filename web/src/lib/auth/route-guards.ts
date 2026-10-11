import type { UserRole } from "@/types";
import { ROLES_CONFIG, isAdminRole } from "./roles";

/** Pages reachable without a session. */
export const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password", "/403"] as const;

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isPathAllowedForRole(role: UserRole | undefined, pathname: string): boolean {
  if (!role) return false;
  if (isPublicPath(pathname)) return true;
  // Admins may open every area, including the role-specific dashboards.
  if (isAdminRole(role)) return true;
  return ROLES_CONFIG[role]?.allowedPrefixes.some((prefix) => pathname.startsWith(prefix)) ?? false;
}

export function getDefaultDashboardPath(role: UserRole | undefined): string {
  return (role && ROLES_CONFIG[role]?.defaultPath) || "/login";
}
