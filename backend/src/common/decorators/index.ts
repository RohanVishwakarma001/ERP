import { createParamDecorator, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthUser } from '../interfaces/auth-user.interface';

export const IS_PUBLIC_KEY = 'isPublic';
/** Opts a route out of the global JwtAuthGuard. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
/** Restricts a route to the given roles (SUPER_ADMIN always passes). See RoleGroups. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

function userFrom(ctx: ExecutionContext): AuthUser {
  return ctx.switchToHttp().getRequest().user;
}

/** Injects the authenticated user, or one of its fields: `@CurrentUser('id')`. */
export const CurrentUser = createParamDecorator(
  (field: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const user = userFrom(ctx);
    return field ? user?.[field] : user;
  },
);

/**
 * Injects the caller's student profile id. Rejects with 403 when the account has
 * no student profile, so services never receive `undefined` and never fall back
 * to someone else's data.
 */
export const CurrentStudentId = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const studentId = userFrom(ctx)?.studentId;
  if (!studentId) throw new ForbiddenException('This action requires a student account.');
  return studentId;
});

/** Faculty counterpart of `CurrentStudentId`. */
export const CurrentFacultyId = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const facultyId = userFrom(ctx)?.facultyId;
  if (!facultyId) throw new ForbiddenException('This action requires a faculty account.');
  return facultyId;
});
