import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AppConfig, type BootstrapAccountConfig } from '../../config';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { maskIdentifier } from '../../common/utils/redact';
import { BCRYPT_ROUNDS_PASSWORD } from '../auth/auth.constants';

/**
 * Marker stored in AdminProfile.employeeId. It identifies each env-managed account
 * independently of its email, so changing SUPER_ADMIN_EMAIL renames the same account
 * instead of creating a second one.
 */
export const BOOTSTRAP_EMPLOYEE_IDS = {
  [UserRole.SUPER_ADMIN]: 'SYSTEM/SUPER_ADMIN',
  [UserRole.ADMIN]: 'SYSTEM/ADMIN',
} as const;

type BootstrapRole = keyof typeof BOOTSTRAP_EMPLOYEE_IDS;

const DEFAULT_NAMES: Record<BootstrapRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Administrator',
  [UserRole.ADMIN]: 'Administrator',
};

const RETRY_DELAYS_MS = [2_000, 5_000, 10_000, 20_000, 40_000];

/**
 * Keeps the super-admin and admin accounts in step with `.env`.
 *
 * On every boot: creates the account if it doesn't exist, applies any change to
 * the email (login), name or password, and disables an env-managed account whose
 * variables were removed. A password change revokes that account's sessions.
 * Every other account is created by an admin from inside the app.
 */
@Injectable()
export class AdminBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfig,
  ) {}

  onApplicationBootstrap() {
    // Don't block startup: a serverless database may still be waking up.
    void this.syncWithRetry();
  }

  private async syncWithRetry() {
    for (let attempt = 0; ; attempt++) {
      try {
        await this.sync();
        return;
      } catch (error) {
        const delay = RETRY_DELAYS_MS[attempt];
        if (delay === undefined) {
          this.logger.error(`Could not sync admin accounts from .env: ${(error as Error).message}`);
          return;
        }
        this.logger.warn(`Admin account sync failed (${(error as Error).message}); retrying in ${delay / 1000}s`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  async sync() {
    await this.syncAccount(UserRole.SUPER_ADMIN, this.config.superAdminAccount);
    await this.syncAccount(UserRole.ADMIN, this.config.adminAccount);
  }

  private async syncAccount(role: BootstrapRole, account: BootstrapAccountConfig | null) {
    const employeeId = BOOTSTRAP_EMPLOYEE_IDS[role];
    const profile = await this.prisma.adminProfile.findUnique({ where: { employeeId }, include: { user: true } });

    if (!account) {
      if (profile && profile.user.status === UserStatus.ACTIVE) {
        await this.prisma.$transaction([
          this.prisma.user.update({ where: { id: profile.userId }, data: { status: UserStatus.INACTIVE } }),
          this.revokeSessions(profile.userId),
        ]);
        this.logger.warn(`${role} variables were removed from .env; account ${maskIdentifier(profile.user.email)} disabled.`);
      } else if (!profile && role === UserRole.SUPER_ADMIN) {
        this.logger.warn('SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD are not set — no one can sign in to an empty database.');
      }
      return;
    }

    const name = account.name ?? DEFAULT_NAMES[role];
    const emailOwner = await this.prisma.user.findUnique({
      where: { email: account.email },
      include: { student: { select: { id: true } }, faculty: { select: { id: true } }, adminProfile: true },
    });

    // The email must not belong to someone else.
    if (emailOwner && emailOwner.id !== profile?.userId) {
      if (profile || emailOwner.student || emailOwner.faculty || emailOwner.adminProfile) {
        this.logger.error(
          `${role}_EMAIL ${maskIdentifier(account.email)} already belongs to another account; ${role} was not updated.`,
        );
        return;
      }
      // A bare account with that email (no profile): adopt it as the env-managed one.
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: emailOwner.id },
          data: {
            name,
            role,
            status: UserStatus.ACTIVE,
            deletedAt: null,
            passwordHash: await bcrypt.hash(account.password, BCRYPT_ROUNDS_PASSWORD),
            adminProfile: { create: { employeeId, designation: DEFAULT_NAMES[role] } },
          },
        }),
        this.revokeSessions(emailOwner.id),
      ]);
      this.logger.log(`${role} account ${maskIdentifier(account.email)} configured from .env.`);
      return;
    }

    if (!profile) {
      await this.prisma.user.create({
        data: {
          email: account.email,
          name,
          role,
          status: UserStatus.ACTIVE,
          passwordHash: await bcrypt.hash(account.password, BCRYPT_ROUNDS_PASSWORD),
          adminProfile: { create: { employeeId, designation: DEFAULT_NAMES[role] } },
        },
      });
      this.logger.log(`${role} account ${maskIdentifier(account.email)} created from .env.`);
      return;
    }

    const user = profile.user;
    const passwordChanged = !(await bcrypt.compare(account.password, user.passwordHash));
    const changes = {
      ...(user.email !== account.email && { email: account.email }),
      ...(user.name !== name && { name }),
      ...(user.role !== role && { role }),
      ...(user.status !== UserStatus.ACTIVE && { status: UserStatus.ACTIVE }),
      ...(user.deletedAt && { deletedAt: null }),
      ...(passwordChanged && { passwordHash: await bcrypt.hash(account.password, BCRYPT_ROUNDS_PASSWORD) }),
    };
    if (Object.keys(changes).length === 0) return;

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: user.id }, data: changes }),
      // New credentials sign out existing sessions.
      ...(passwordChanged || changes.email ? [this.revokeSessions(user.id)] : []),
    ]);
    this.logger.log(`${role} account ${maskIdentifier(account.email)} updated from .env (${Object.keys(changes).join(', ')}).`);
  }

  private revokeSessions(userId: string) {
    return this.prisma.refreshToken.updateMany({ where: { userId, isRevoked: false }, data: { isRevoked: true } });
  }
}
