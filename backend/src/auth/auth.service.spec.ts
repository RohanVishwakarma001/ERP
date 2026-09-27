import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService (Authentication & RBAC Logic Tests)', () => {
  let service: AuthService;
  let mockPrisma: any;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeEach(() => {
    mockPrisma = {
      user: { findFirst: jest.fn().mockResolvedValue(null) },
      refreshToken: { create: jest.fn().mockResolvedValue({ id: 'rt-1' }) },
    };
    jwtService = new JwtService({ secret: 'test-secret' });
    configService = new ConfigService();

    service = new AuthService(
      mockPrisma as PrismaService,
      jwtService,
      configService,
    );
  });

  describe('User Login Flow', () => {
    it('should authenticate student and issue access & refresh tokens', async () => {
      const result = await service.login({
        identifier: 'aarav.sharma@jbitdoon.edu.in',
        password: 'Jbit@2026',
      });

      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.name).toBe('Aarav Sharma');
      expect(result.user.role).toBe('STUDENT');
    });

    it('should authenticate faculty HOD and issue tokens with faculty profile', async () => {
      const result = await service.login({
        identifier: 'hod.cse@jbitdoon.edu.in',
        password: 'Jbit@2026',
      });

      expect(result).toBeDefined();
      expect(result.user.name).toBe('Dr. V. K. Bhatt');
      expect(result.user.role).toBe('HOD');
    });

    it('should reject invalid credentials with UnauthorizedException', async () => {
      await expect(
        service.login({
          identifier: 'nonexistent@jbitdoon.edu.in',
          password: 'WrongPassword',
        }),
      ).rejects.toThrow('Invalid credentials. User not found.');
    });
  });

  describe('OTP & Password Recovery', () => {
    it('should verify valid 6-digit OTP token', async () => {
      const res = await service.verifyOtp({
        identifier: 'aarav.sharma@jbitdoon.edu.in',
        otp: '482910',
      });

      expect(res.verified).toBe(true);
    });

    it('should reject invalid length OTP tokens', async () => {
      await expect(
        service.verifyOtp({
          identifier: 'aarav.sharma@jbitdoon.edu.in',
          otp: '123',
        }),
      ).rejects.toThrow('OTP must be a valid 6-digit number');
    });
  });
});
