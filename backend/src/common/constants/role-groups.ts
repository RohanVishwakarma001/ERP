import { UserRole } from '@prisma/client';

/**
 * Reusable role sets for `@Roles(...)`. SUPER_ADMIN always passes RolesGuard,
 * so it is not listed explicitly. Prefer these over ad-hoc role lists so a
 * policy change (e.g. "exam officers may also lock the timetable") is one edit.
 */
const { ADMIN, HOD, FACULTY, EXAM_OFFICER, ACCOUNTANT, LIBRARIAN, PLACEMENT_OFFICER, HOSTEL_WARDEN, TRANSPORT_MANAGER } =
  UserRole;

export const RoleGroups = {
  /** Institution-wide administrators. */
  ADMINS: [ADMIN],
  /** Department heads and above — academic governance. */
  ACADEMIC_LEADERSHIP: [ADMIN, HOD],
  /** Anyone who teaches: may take attendance, enter marks. */
  TEACHING_STAFF: [ADMIN, HOD, FACULTY],
  /** Controller of examinations and academic leadership. */
  EXAM_CONTROL: [ADMIN, HOD, EXAM_OFFICER],
  /** Staff who may view the full student roster. */
  ROSTER_VIEWERS: [ADMIN, HOD, FACULTY, EXAM_OFFICER, ACCOUNTANT, LIBRARIAN, PLACEMENT_OFFICER, HOSTEL_WARDEN, TRANSPORT_MANAGER],
  FINANCE: [ADMIN, ACCOUNTANT],
  LIBRARY: [ADMIN, LIBRARIAN],
  PLACEMENT: [ADMIN, PLACEMENT_OFFICER],
  HOSTEL: [ADMIN, HOSTEL_WARDEN],
  TRANSPORT: [ADMIN, TRANSPORT_MANAGER],
} as const satisfies Record<string, readonly UserRole[]>;
