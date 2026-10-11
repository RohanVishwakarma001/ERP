import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  name: string;
  studentId?: string;
  facultyId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    let user;
    try {
      user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          student: true,
          faculty: true,
        },
      });
    } catch {
      // A DB connectivity blip (e.g. a serverless Postgres instance waking from
      // idle) — distinct wording so clients can tell this apart from a genuinely
      // invalid/expired token and retry instead of forcing a re-login.
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
      permissions: [],
    };
  }
}
