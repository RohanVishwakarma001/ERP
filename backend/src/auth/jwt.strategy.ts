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
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET', 'jbit_super_secure_access_secret_token_2026_utu_node'),
    });
  }

  async validate(payload: JwtPayload) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          student: true,
          faculty: true,
        },
      });

      if (user && user.status === 'ACTIVE' && !user.deletedAt) {
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          studentId: user.student?.id || payload.studentId,
          facultyId: user.faculty?.id || payload.facultyId,
          departmentId: user.student?.departmentId || user.faculty?.departmentId,
          permissions: [],
        };
      }
    } catch {
      // In development fallback if database table not yet populated or offline
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      studentId: payload.studentId,
      facultyId: payload.facultyId,
      permissions: [],
    };
  }
}
