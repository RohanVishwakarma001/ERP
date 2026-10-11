import { UserRole } from "@/types";

export type Permission =
  | "departments:manage"
  | "departments:view"
  | "students:roster"
  | "students:debarment:manage"
  | "faculty:manage"
  | "timetable:engine"
  | "exams:controller"
  | "exams:mark_locking"
  | "placement:drives:manage"
  | "placement:recruiter:evaluate"
  | "fees:structure:manage"
  | "fees:collect"
  | "library:manage"
  | "hostel:manage"
  | "transport:manage"
  | "attendance:mark"
  | "attendance:view_self"
  | "marks:entry"
  | "audit:view"
  | "settings:system";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    "departments:manage",
    "departments:view",
    "students:roster",
    "students:debarment:manage",
    "faculty:manage",
    "timetable:engine",
    "exams:controller",
    "exams:mark_locking",
    "placement:drives:manage",
    "placement:recruiter:evaluate",
    "fees:structure:manage",
    "fees:collect",
    "library:manage",
    "hostel:manage",
    "transport:manage",
    "audit:view",
    "settings:system",
  ],
  HOD: [
    "departments:view",
    "students:roster",
    "students:debarment:manage",
    "faculty:manage",
    "timetable:engine",
    "attendance:mark",
    "marks:entry",
  ],
  ACCOUNTANT: [
    "fees:structure:manage",
    "fees:collect",
    "students:roster",
  ],
  EXAM_OFFICER: [
    "exams:controller",
    "exams:mark_locking",
    "students:roster",
    "students:debarment:manage",
  ],
  LIBRARIAN: [
    "library:manage",
    "students:roster",
  ],
  PLACEMENT_OFFICER: [
    "placement:drives:manage",
    "placement:recruiter:evaluate",
    "students:roster",
  ],
  HOSTEL_WARDEN: [
    "hostel:manage",
    "students:roster",
  ],
  TRANSPORT_MANAGER: [
    "transport:manage",
    "students:roster",
  ],
  FACULTY: [
    "attendance:mark",
    "marks:entry",
    "departments:view",
  ],
  STUDENT: [
    "attendance:view_self",
  ],
};

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
