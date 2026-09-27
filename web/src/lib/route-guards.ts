import { UserRole } from "@/types";
import { ROLES_CONFIG } from "./roles";

export function isPathAllowedForRole(role: UserRole | undefined, pathname: string): boolean {
  if (!role) return false;
  if (pathname === "/login" || pathname === "/forgot-password" || pathname === "/reset-password") {
    return true;
  }
  
  // Super Admin has access to all admin paths and departmental overviews
  if (role === "ADMIN") {
    return true;
  }

  const config = ROLES_CONFIG[role];
  if (!config) return false;

  return config.allowedPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export function getDefaultDashboardPath(role: UserRole | undefined): string {
  if (!role) return "/login";
  return ROLES_CONFIG[role]?.defaultPath || "/login";
}
