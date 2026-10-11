import * as bcrypt from 'bcryptjs';
import { AdminBootstrapService } from './admin-bootstrap.service';
import { AppConfig } from '../../config';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('AdminBootstrapService (.env-managed admin accounts)', () => {
  let prisma: any;
  let config: { superAdminAccount: any; adminAccount: any };
  let service: AdminBootstrapService;

  const PASSWORD = 'Str0ng!Passw0rd';

  beforeEach(() => {
    prisma = {
      adminProfile: { findUnique: jest.fn().mockResolvedValue(null) },
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockReturnValue('user.update'),
      },
      refreshToken: { updateMany: jest.fn().mockReturnValue('refreshToken.revoke') },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    config = { superAdminAccount: { email: 'head@college.edu', password: PASSWORD }, adminAccount: null };
    service = new AdminBootstrapService(prisma as PrismaService, config as unknown as AppConfig);
  });

  const existingSuperAdmin = async (overrides: Record<string, unknown> = {}) => ({
    userId: 'u-1',
    employeeId: 'SYSTEM/SUPER_ADMIN',
    user: {
      id: 'u-1',
      email: 'head@college.edu',
      name: 'Super Administrator',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      deletedAt: null,
      passwordHash: await bcrypt.hash(PASSWORD, 4),
      ...overrides,
    },
  });

  it('creates the super admin with a hashed password when none exists', async () => {
    await service.sync();

    expect(prisma.user.create).toHaveBeenCalledTimes(1);
    const { data } = prisma.user.create.mock.calls[0][0];
    expect(data).toMatchObject({ email: 'head@college.edu', role: 'SUPER_ADMIN', status: 'ACTIVE' });
    expect(data.adminProfile.create.employeeId).toBe('SYSTEM/SUPER_ADMIN');
    expect(data.passwordHash).not.toBe(PASSWORD);
    expect(await bcrypt.compare(PASSWORD, data.passwordHash)).toBe(true);
  });

  it('does nothing when the account already matches .env', async () => {
    prisma.adminProfile.findUnique.mockImplementation(({ where }) =>
      where.employeeId === 'SYSTEM/SUPER_ADMIN' ? existingSuperAdmin() : null,
    );
    prisma.user.findUnique.mockResolvedValue({ id: 'u-1' });

    await service.sync();

    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('applies a new email and password to the same account and revokes its sessions', async () => {
    config.superAdminAccount = { email: 'new.head@college.edu', password: 'An0ther!Secret' };
    prisma.adminProfile.findUnique.mockImplementation(({ where }) =>
      where.employeeId === 'SYSTEM/SUPER_ADMIN' ? existingSuperAdmin() : null,
    );

    await service.sync();

    const update = prisma.user.update.mock.calls[0][0];
    expect(update.where).toEqual({ id: 'u-1' });
    expect(update.data.email).toBe('new.head@college.edu');
    expect(await bcrypt.compare('An0ther!Secret', update.data.passwordHash)).toBe(true);
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({ where: { userId: 'u-1', isRevoked: false }, data: { isRevoked: true } });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('refuses to take over an email that belongs to another profiled account', async () => {
    config.superAdminAccount = { email: 'student@college.edu', password: PASSWORD };
    prisma.adminProfile.findUnique.mockImplementation(({ where }) =>
      where.employeeId === 'SYSTEM/SUPER_ADMIN' ? existingSuperAdmin() : null,
    );
    prisma.user.findUnique.mockResolvedValue({ id: 'u-2', student: { id: 's-1' }, faculty: null, adminProfile: null });

    await service.sync();

    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('disables an env-managed account whose variables were removed', async () => {
    config.superAdminAccount = { email: 'head@college.edu', password: PASSWORD };
    prisma.adminProfile.findUnique.mockImplementation(async ({ where }) =>
      where.employeeId === 'SYSTEM/ADMIN'
        ? { ...(await existingSuperAdmin()), userId: 'u-9', employeeId: 'SYSTEM/ADMIN', user: { id: 'u-9', email: 'a@college.edu', status: 'ACTIVE' } }
        : existingSuperAdmin(),
    );
    prisma.user.findUnique.mockResolvedValue({ id: 'u-1' });

    await service.sync();

    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 'u-9' }, data: { status: 'INACTIVE' } });
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({ where: { userId: 'u-9', isRevoked: false }, data: { isRevoked: true } });
  });
});
