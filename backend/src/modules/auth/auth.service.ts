import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/email/email.service';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import {
  LoginDto,
  RefreshTokenDto,
  VerifyOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  private get accessSecret(): string {
    return this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
  }

  private get refreshSecret(): string {
    return this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  private findUserByIdentifier(identifier: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier },
          { student: { rollNumber: identifier } },
          { student: { enrollmentNumber: identifier } },
          { faculty: { employeeCode: identifier } },
        ],
      },
      include: { student: true, faculty: true },
    });
  }

  async login(dto: LoginDto) {
    const identifier = dto.identifier.trim().toLowerCase();
    const user = await this.findUserByIdentifier(identifier);

    if (!user || user.status !== 'ACTIVE' || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return this.issueSession(user);
  }

  private async issueSession(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      studentId: user.student?.id,
      facultyId: user.faculty?.id,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.accessSecret,
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.refreshSecret,
      expiresIn: '7d',
    });

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.student?.departmentId || user.faculty?.departmentId,
        rollNumber: user.student?.rollNumber,
        semester: user.student?.semester,
        cgpa: user.student?.cgpa,
        overallAttendance: user.student?.overallAttendance,
        designation: user.faculty?.designation,
      },
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    let payload: any;
    try {
      payload = this.jwtService.verify(dto.refreshToken, { secret: this.refreshSecret });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const candidates = await this.prisma.refreshToken.findMany({
      where: {
        userId: payload.sub,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    let matched: (typeof candidates)[number] | null = null;
    for (const candidate of candidates) {
      if (await bcrypt.compare(dto.refreshToken, candidate.tokenHash)) {
        matched = candidate;
        break;
      }
    }

    if (!matched) {
      throw new UnauthorizedException('Refresh token has been revoked or is no longer valid.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { student: true, faculty: true },
    });

    if (!user || user.status !== 'ACTIVE' || user.deletedAt) {
      throw new UnauthorizedException('Account is no longer active.');
    }

    // Rotate: revoke the used refresh token and issue a fresh pair.
    await this.prisma.refreshToken.update({
      where: { id: matched.id },
      data: { isRevoked: true },
    });

    return this.issueSession(user);
  }

  private async issueOtp(identifier: string, purpose: 'PASSWORD_RESET' | 'LOGIN_2FA') {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codeHash = await bcrypt.hash(code, 10);

    await this.prisma.otpToken.create({
      data: {
        identifier,
        purpose,
        codeHash,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    try {
      await this.emailService.sendOtpEmail(identifier, code, purpose);
    } catch {
      this.logger.error(`Failed to deliver OTP email to ${identifier}`);
    }
  }

  private async consumeOtp(identifier: string, purpose: 'PASSWORD_RESET' | 'LOGIN_2FA', code: string) {
    const otpRecord = await this.prisma.otpToken.findFirst({
      where: {
        identifier,
        purpose,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException('No active verification code found. Please request a new one.');
    }

    if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestException('Too many incorrect attempts. Please request a new code.');
    }

    const isMatch = await bcrypt.compare(code, otpRecord.codeHash);
    if (!isMatch) {
      await this.prisma.otpToken.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Invalid verification code.');
    }

    await this.prisma.otpToken.update({
      where: { id: otpRecord.id },
      data: { consumedAt: new Date() },
    });
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const identifier = dto.identifier.trim().toLowerCase();
    await this.consumeOtp(identifier, 'PASSWORD_RESET', dto.otp);
    return { verified: true, message: 'Verification code accepted.' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const identifier = dto.identifier.trim().toLowerCase();
    const user = await this.findUserByIdentifier(identifier);

    // Always respond generically so this endpoint cannot be used to enumerate accounts.
    if (user && user.status === 'ACTIVE' && !user.deletedAt) {
      await this.issueOtp(identifier, 'PASSWORD_RESET');
    } else {
      this.logger.warn(`Password reset requested for unknown/inactive identifier: ${identifier}`);
    }

    return {
      message: `If an account matching ${dto.identifier} exists, a verification code has been sent to its registered email.`,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const identifier = dto.identifier.trim().toLowerCase();
    await this.consumeOtp(identifier, 'PASSWORD_RESET', dto.otp);

    const user = await this.findUserByIdentifier(identifier);
    if (!user) {
      throw new BadRequestException('Account not found.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Force re-login everywhere: revoke all existing refresh tokens for this account.
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, isRevoked: false },
      data: { isRevoked: true },
    });

    return {
      success: true,
      message: 'Password reset successfully. You may now log in with your new credentials.',
    };
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
    return { success: true, message: 'Logged out successfully from institutional session.' };
  }
}
