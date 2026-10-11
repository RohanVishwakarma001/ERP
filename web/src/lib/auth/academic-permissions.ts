import type { User } from "@/types";
import { isAdminRole } from "./roles";

/**
 * Who may change the academic structure. Mirrors the backend rules in
 * departments.service.ts — the API enforces them; this only hides controls.
 *
 * - Departments and sections: administrators.
 * - Programs and courses: administrators anywhere, HODs in their own department.
 */
export function canManageDepartments(user: User | null): boolean {
  return isAdminRole(user?.role);
}

export function canManageSections(user: User | null): boolean {
  return isAdminRole(user?.role);
}

/** May create programs/courses in at least one department. */
export function canManageCurriculum(user: User | null): boolean {
  return isAdminRole(user?.role) || (user?.role === "HOD" && Boolean(user.departmentId));
}

/** May change programs/courses that belong to this department. */
export function canManageInDepartment(user: User | null, departmentId: string): boolean {
  if (isAdminRole(user?.role)) return true;
  return user?.role === "HOD" && user.departmentId === departmentId;
}
