import { ForbiddenException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from './users.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('UsersService.resetPassword (admin sets a user password)', () => {
  let prisma: any;
  let service: UsersService;

  const superAdmin: AuthUser = { id: 'u-sa', email: 'sa@x.edu', name: 'SA', role: 'SUPER_ADMIN' };
  const admin: AuthUser = { id: 'u-admin', email: 'a@x.edu', name: 'Admin', role: 'ADMIN' };
  const NEW_PASSWORD = 'N3w!Student1';

  const account = (overrides: Record<string, unknown> = {}) => ({
    id: 'u-stu',
    email: 'Riya@College.edu',
    phone: null,
    role: 'STUDENT',
    student: { rollNumber: 'CS2401' },
    faculty: null,
    adminProfile: null,
    ...overrides,
  });

  beforeEach(() => {
    prisma = {
      user: { findFirst: jest.fn().mockResolvedValue(account()), update: jest.fn().mockReturnValue('update') },
      student: { findUnique: jest.fn().mockResolvedValue({ enrollmentNumber: 'ENR-77' }) },
      refreshToken: { updateMany: jest.fn().mockReturnValue('revoke') },
      otpToken: { deleteMany: jest.fn().mockReturnValue('otp') },
      auditLog: { create: jest.fn().mockReturnValue('audit') },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    service = new UsersService(prisma as PrismaService);
  });

  it("sets a hashed password, signs the student out, clears reset codes and audits it", async () => {
    await expect(service.resetPassword('u-stu', { password: NEW_PASSWORD }, admin, '10.0.0.1')).resolves.toEqual({
      id: 'u-stu',
      passwordChanged: true,
    });

    const { data } = prisma.user.update.mock.calls[0][0];
    expect(data.passwordHash).not.toBe(NEW_PASSWORD);
    expect(await bcrypt.compare(NEW_PASSWORD, data.passwordHash)).toBe(true);
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({ where: { userId: 'u-stu', isRevoked: false }, data: { isRevoked: true } });
    expect(prisma.otpToken.deleteMany).toHaveBeenCalledWith({
      where: { identifier: { in: ['riya@college.edu', 'cs2401', 'enr-77'] }, consumedAt: null },
    });
    const audit = prisma.auditLog.create.mock.calls[0][0].data;
    expect(audit).toMatchObject({ userId: 'u-admin', action: 'ADMIN_RESET_PASSWORD', entityId: 'u-stu', ipAddress: '10.0.0.1' });
    expect(JSON.stringify(audit)).not.toContain(NEW_PASSWORD);
  });

  it('404s for an unknown account', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    await expect(service.resetPassword('u-x', { password: NEW_PASSWORD }, admin)).rejects.toThrow(NotFoundException);
  });

  it('refuses the .env-managed accounts', async () => {
    prisma.user.findFirst.mockResolvedValue(account({ role: 'SUPER_ADMIN', adminProfile: { employeeId: 'SYSTEM/SUPER_ADMIN' } }));
    await expect(service.resetPassword('u-stu', { password: NEW_PASSWORD }, admin)).rejects.toThrow(ForbiddenException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("refuses an admin resetting another admin's password, but allows the super admin", async () => {
    prisma.user.findFirst.mockResolvedValue(account({ role: 'ADMIN', student: null, adminProfile: { employeeId: 'ADM/2' } }));
    await expect(service.resetPassword('u-stu', { password: NEW_PASSWORD }, admin)).rejects.toThrow(ForbiddenException);
    await expect(service.resetPassword('u-stu', { password: NEW_PASSWORD }, superAdmin)).resolves.toMatchObject({ passwordChanged: true });
  });

  it('refuses changing your own password this way', async () => {
    prisma.user.findFirst.mockResolvedValue(account({ id: 'u-admin', role: 'ADMIN' }));
    await expect(service.resetPassword('u-admin', { password: NEW_PASSWORD }, admin)).rejects.toThrow(ForbiddenException);
  });
});
