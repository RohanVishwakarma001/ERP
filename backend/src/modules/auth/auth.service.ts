import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { AppConfig } from '../../config';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { EmailService } from '../../infrastructure/email/email.service';
import { maskIdentifier } from '../../common/utils/redact';
import * as bcrypt from 'bcryptjs';
import { randomInt, randomUUID } from 'crypto';
import {
  LoginDto,
  RefreshTokenDto,
  VerifyOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import {
  ACCESS_TOKEN_TTL,
  JWT_ALGORITHM,
  BCRYPT_ROUNDS_PASSWORD,
  BCRYPT_ROUNDS_TOKEN,
  OTP_MAX_ATTEMPTS,
  OTP_TTL_MS,
  REFRESH_TOKEN_TTL,
  REFRESH_TOKEN_TTL_MS,
} from './auth.constants';

const USER_PROFILE_INCLUDE = {
  student: { include: { department: true } },
  faculty: { include: { department: true } },
} satisfies Prisma.UserInclude;

type UserWithProfile = Prisma.UserGetPayload<{ include: typeof USER_PROFILE_INCLUDE }>;

/**
 * Compared against when no user matches, so a login for an unknown identifier
 * costs the same bcrypt work as a wrong password and response timing can't be
 * used to enumerate accounts.
 */
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('timing-equaliser-not-a-real-password', BCRYPT_ROUNDS_PASSWORD);

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: AppConfig,
    private emailService: EmailService,
  ) {}

  /**
   * Identifiers arrive lower-cased (so OTPs are keyed consistently), but employee
   * codes and enrollment numbers are stored upper-case — match case-insensitively.
   */
  private findUserByIdentifier(identifier: string) {
    const ci = { equals: identifier, mode: 'insensitive' as const };
    return this.prisma.user.findFirst({
      where: {
        OR: [
          { email: ci },
          { phone: identifier },
          { student: { rollNumber: ci } },
          { student: { enrollmentNumber: ci } },
          { faculty: { employeeCode: ci } },
        ],
      },
      include: USER_PROFILE_INCLUDE,
    });
  }

  async login(dto: LoginDto) {
    const identifier = dto.identifier.trim().toLowerCase();
    const user = await this.findUserByIdentifier(identifier);

    // Always run one bcrypt comparison so unknown and known identifiers take the same time.
    const isMatch = await bcrypt.compare(dto.password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!user || !isMatch || user.status !== 'ACTIVE' || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return this.issueSession(user);
  }

  private async issueSession(user: UserWithProfile) {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      studentId: user.student?.id,
      facultyId: user.faculty?.id,
    };

    const accessToken = this.jwtService.sign(
      { ...payload, typ: 'access' },
      { secret: this.config.jwtAccessSecret, expiresIn: ACCESS_TOKEN_TTL, algorithm: JWT_ALGORITHM },
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id, typ: 'refresh', jti: randomUUID() },
      { secret: this.config.jwtRefreshSecret, expiresIn: REFRESH_TOKEN_TTL, algorithm: JWT_ALGORITHM },
    );

    const tokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS_TOKEN);
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
        department: user.student?.department.name ?? user.faculty?.department.name,
        departmentId: user.student?.departmentId ?? user.faculty?.departmentId,
        rollNumber: user.student?.rollNumber,
        semester: user.student?.semester,
        cgpa: user.student?.cgpa,
        overallAttendance: user.student?.overallAttendance,
        designation: user.faculty?.designation,
      },
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    let payload: { sub: string; typ?: string };
    try {
      payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.config.jwtRefreshSecret,
        algorithms: [JWT_ALGORITHM],
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }
    if (payload.typ !== undefined && payload.typ !== 'refresh') {
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
      include: USER_PROFILE_INCLUDE,
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

  /** Stores the OTP against `identifier` (what the user will type back) and mails it to `email`. */
  private async issueOtp(identifier: string, email: string, purpose: 'PASSWORD_RESET' | 'LOGIN_2FA') {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS_TOKEN);

    await this.prisma.otpToken.create({
      data: {
        identifier,
        purpose,
        codeHash,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    try {
      await this.emailService.sendOtpEmail(email, code, purpose);
    } catch {
      this.logger.error(`Failed to deliver OTP email to ${maskIdentifier(email)}`);
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
      await this.issueOtp(identifier, user.email, 'PASSWORD_RESET');
    } else {
      this.logger.warn(`Password reset requested for unknown/inactive identifier: ${maskIdentifier(identifier)}`);
    }

    return {
      message: 'If an account matching these details exists, a verification code has been sent to its registered email.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const identifier = dto.identifier.trim().toLowerCase();
    await this.consumeOtp(identifier, 'PASSWORD_RESET', dto.otp);

    const user = await this.findUserByIdentifier(identifier);
    if (!user || user.status !== 'ACTIVE' || user.deletedAt) {
      throw new BadRequestException('Unable to reset the password for this account.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS_PASSWORD);
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
