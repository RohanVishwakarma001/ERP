import { UserRole } from '@prisma/client';

/**
 * The authenticated principal attached to `request.user` by JwtStrategy.
 * `studentId` / `facultyId` are set only when the account has that profile.
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  studentId?: string;
  facultyId?: string;
  departmentId?: string;
}
