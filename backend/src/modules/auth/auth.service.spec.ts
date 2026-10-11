import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { AppConfig } from '../../config';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { EmailService } from '../../infrastructure/email/email.service';

describe('AuthService (Authentication & RBAC Logic Tests)', () => {
  let service: AuthService;
  let mockPrisma: any;
  let jwtService: JwtService;
  let config: AppConfig;
  let emailService: EmailService;

  const activeUser = {
    id: 'usr-student-01',
    email: 'aarav.sharma@jbitdoon.edu.in',
    name: 'Aarav Sharma',
    role: 'STUDENT',
    status: 'ACTIVE',
    deletedAt: null,
    passwordHash: '' as string,
    student: { id: 'stu-01', rollNumber: '220102048', semester: 6, cgpa: 8.92, departmentId: 'dept-cse', department: { name: 'Computer Science & Engineering' }, overallAttendance: 84.5 },
    faculty: null,
  };

  beforeEach(async () => {
    activeUser.passwordHash = await bcrypt.hash('Jbit@2026', 10);

    mockPrisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue(activeUser),
        update: jest.fn().mockResolvedValue(activeUser),
      },
      refreshToken: {
        create: jest.fn().mockResolvedValue({ id: 'rt-1' }),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      otpToken: {
        create: jest.fn().mockResolvedValue({ id: 'otp-1' }),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    jwtService = new JwtService({ secret: 'test-secret' });
    config = {
      jwtAccessSecret: 'test-JWT_ACCESS_SECRET',
      jwtRefreshSecret: 'test-JWT_REFRESH_SECRET',
    } as unknown as AppConfig;
    emailService = { sendOtpEmail: jest.fn().mockResolvedValue(undefined) } as unknown as EmailService;

    service = new AuthService(mockPrisma as PrismaService, jwtService, config, emailService);
  });

  describe('User Login Flow', () => {
    it('authenticates a real DB user with a matching password hash', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(activeUser);

      const result = await service.login({ identifier: 'aarav.sharma@jbitdoon.edu.in', password: 'Jbit@2026' });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.name).toBe('Aarav Sharma');
      expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
    });

    it('rejects a correct-looking identifier with the wrong password', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(activeUser);

      await expect(
        service.login({ identifier: 'aarav.sharma@jbitdoon.edu.in', password: 'WrongPassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects login for an identifier with no matching user (no demo-account fallback)', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.login({ identifier: 'nonexistent@jbitdoon.edu.in', password: 'anything', role: 'ADMIN' } as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects login for a suspended/inactive account', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ ...activeUser, status: 'SUSPENDED' });

      await expect(
        service.login({ identifier: 'aarav.sharma@jbitdoon.edu.in', password: 'Jbit@2026' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Refresh token rotation', () => {
    it('rejects a refresh token that has no matching stored hash', async () => {
      const refreshToken = jwtService.sign({ sub: activeUser.id }, { secret: 'test-JWT_REFRESH_SECRET', expiresIn: '7d' });
      mockPrisma.refreshToken.findMany.mockResolvedValue([]);

      await expect(service.refreshToken({ refreshToken })).rejects.toThrow(UnauthorizedException);
    });

    it('rotates a valid refresh token and revokes the old one', async () => {
      const refreshToken = jwtService.sign({ sub: activeUser.id }, { secret: 'test-JWT_REFRESH_SECRET', expiresIn: '7d' });
      const tokenHash = await bcrypt.hash(refreshToken, 10);
      mockPrisma.refreshToken.findMany.mockResolvedValue([
        { id: 'rt-existing', tokenHash, isRevoked: false, expiresAt: new Date(Date.now() + 100000) },
      ]);

      const result = await service.refreshToken({ refreshToken });

      expect(result.accessToken).toBeDefined();
      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'rt-existing' }, data: { isRevoked: true } }),
      );
    });
  });

  describe('OTP & Password Recovery', () => {
    it('rejects OTP verification when no active code exists', async () => {
      mockPrisma.otpToken.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyOtp({ identifier: 'aarav.sharma@jbitdoon.edu.in', otp: '123456' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('accepts a correct, unexpired OTP and marks it consumed', async () => {
      const codeHash = await bcrypt.hash('482910', 10);
      mockPrisma.otpToken.findFirst.mockResolvedValue({
        id: 'otp-1',
        codeHash,
        attempts: 0,
        expiresAt: new Date(Date.now() + 60000),
      });

      const res = await service.verifyOtp({ identifier: 'aarav.sharma@jbitdoon.edu.in', otp: '482910' });

      expect(res.verified).toBe(true);
      expect(mockPrisma.otpToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'otp-1' }, data: { consumedAt: expect.any(Date) } }),
      );
    });

    it('rejects an incorrect OTP and records the attempt', async () => {
      const codeHash = await bcrypt.hash('482910', 10);
      mockPrisma.otpToken.findFirst.mockResolvedValue({
        id: 'otp-1',
        codeHash,
        attempts: 0,
        expiresAt: new Date(Date.now() + 60000),
      });

      await expect(
        service.verifyOtp({ identifier: 'aarav.sharma@jbitdoon.edu.in', otp: '000000' }),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.otpToken.update).toHaveBeenCalled();
    });

    it('does not reveal whether an identifier exists on forgot-password', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const res = await service.forgotPassword({ identifier: 'nonexistent@jbitdoon.edu.in' });

      expect(res.message).toContain('If an account matching');
      expect(res.message).not.toContain('nonexistent');
      expect(emailService.sendOtpEmail).not.toHaveBeenCalled();
    });
  });
});
