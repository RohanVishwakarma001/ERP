import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfig } from '../../config';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { JWT_ALGORITHM } from './auth.constants';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  name: string;
  studentId?: string;
  facultyId?: string;
  typ?: 'access' | 'refresh';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: AppConfig,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwtAccessSecret,
      algorithms: [JWT_ALGORITHM],
    });
  }

  /** Re-reads the user on every request so deactivated accounts lose access immediately. */
  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (payload.typ === 'refresh') throw new UnauthorizedException('Invalid access token.');

    let user;
    try {
      user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { student: true, faculty: true },
      });
    } catch {
      // A DB connectivity blip (e.g. serverless Postgres waking from idle). Distinct
      // wording lets clients retry instead of forcing a re-login — the web and mobile
      // API clients match on "temporarily".
      throw new UnauthorizedException('Session verification is temporarily unavailable. Please retry.');
    }

    if (!user || user.status !== 'ACTIVE' || user.deletedAt) {
      throw new UnauthorizedException('Account is no longer active.');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      studentId: user.student?.id,
      facultyId: user.faculty?.id,
      departmentId: user.student?.departmentId || user.faculty?.departmentId,
    };
  }
}
