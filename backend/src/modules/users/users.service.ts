import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { BCRYPT_ROUNDS_PASSWORD } from '../auth/auth.constants';
import { BOOTSTRAP_EMPLOYEE_IDS } from './admin-bootstrap.service';
import { CreateUserDto, ListUsersQueryDto, STAFF_ROLES, TEACHING_ROLES, UpdateUserStatusDto } from './dto/users.dto';

const USER_INCLUDE = {
  student: { select: { rollNumber: true, department: { select: { code: true } }, program: { select: { code: true } } } },
  faculty: { select: { employeeCode: true, designation: true, department: { select: { code: true } } } },
  adminProfile: { select: { employeeId: true, designation: true } },
} satisfies Prisma.UserInclude;

type UserRow = Prisma.UserGetPayload<{ include: typeof USER_INCLUDE }>;

const MANAGED_IDS = new Set<string>(Object.values(BOOTSTRAP_EMPLOYEE_IDS));

/** Friendly names for the unique columns a new account can collide on. */
const UNIQUE_FIELD_LABELS: Record<string, string> = {
  email: 'email',
  phone: 'phone number',
  rollNumber: 'roll number',
  enrollmentNumber: 'enrollment number',
  employeeCode: 'employee code',
  employeeId: 'employee id',
};

/** HOD lookups (departments, leave approval) recognise heads by their designation. */
function hodDesignation(designation: string) {
  return /\b(head|hod)\b/i.test(designation) ? designation : `${designation} & HOD`;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListUsersQueryDto) {
    const search = query.search;
    const contains = search ? { contains: search, mode: 'insensitive' as const } : undefined;
    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(query.role && { role: query.role }),
        ...(contains && {
          OR: [
            { name: contains },
            { email: contains },
            { student: { rollNumber: contains } },
            { faculty: { employeeCode: contains } },
            { adminProfile: { employeeId: contains } },
          ],
        }),
      },
      include: USER_INCLUDE,
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
      take: 500,
    });
    return users.map((u) => this.toView(u));
  }

  async create(dto: CreateUserDto, actor: AuthUser) {
    this.assertMayManageRole(actor, dto.role);

    const base = {
      name: dto.name,
      email: dto.email,
      phone: dto.phone ?? null,
      role: dto.role,
      passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS_PASSWORD),
    };

    let profile: Pick<Prisma.UserCreateInput, 'student' | 'faculty' | 'adminProfile'>;
    if (dto.role === UserRole.STUDENT) {
      const program = await this.prisma.program.findUnique({ where: { id: dto.programId! } });
      if (!program) throw new BadRequestException('The selected program no longer exists.');
      if (dto.sectionId && !(await this.prisma.section.findUnique({ where: { id: dto.sectionId } }))) {
        throw new BadRequestException('The selected section no longer exists.');
      }
      if (dto.semester! > program.totalSemesters) {
        throw new BadRequestException(`${program.name} has ${program.totalSemesters} semesters.`);
      }
      profile = {
        student: {
          create: {
            rollNumber: dto.rollNumber!,
            enrollmentNumber: dto.enrollmentNumber!,
            semester: dto.semester!,
            admissionYear: dto.admissionYear!,
            guardianName: dto.guardianName ?? null,
            guardianPhone: dto.guardianPhone ?? null,
            department: { connect: { id: program.departmentId } },
            program: { connect: { id: program.id } },
            ...(dto.sectionId && { section: { connect: { id: dto.sectionId } } }),
          },
        },
      };
    } else if (TEACHING_ROLES.includes(dto.role)) {
      if (!(await this.prisma.department.findUnique({ where: { id: dto.departmentId! } }))) {
        throw new BadRequestException('The selected department no longer exists.');
      }
      profile = {
        faculty: {
          create: {
            employeeCode: dto.employeeCode!,
            designation: dto.role === UserRole.HOD ? hodDesignation(dto.designation!) : dto.designation!,
            qualification: dto.qualification!,
            specialization: dto.specialization ?? null,
            department: { connect: { id: dto.departmentId! } },
          },
        },
      };
    } else if (STAFF_ROLES.includes(dto.role)) {
      profile = { adminProfile: { create: { employeeId: dto.employeeId!, designation: dto.designation! } } };
    } else {
      throw new BadRequestException('Choose a valid role.');
    }

    try {
      const user = await this.prisma.user.create({ data: { ...base, ...profile }, include: USER_INCLUDE });
      return this.toView(user);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const target = ([] as string[]).concat((err.meta?.target as string[] | string | undefined) ?? []);
        const field = target.map((t) => UNIQUE_FIELD_LABELS[t]).find(Boolean);
        throw new ConflictException(field ? `Another account already uses this ${field}.` : 'An account with these details already exists.');
      }
      throw err;
    }
  }

  async updateStatus(id: string, dto: UpdateUserStatusDto, actor: AuthUser) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null }, include: USER_INCLUDE });
    if (!user) throw new NotFoundException('Account not found.');
    if (user.id === actor.id) throw new ForbiddenException('You cannot change the status of your own account.');
    if (user.adminProfile && MANAGED_IDS.has(user.adminProfile.employeeId)) {
      throw new ForbiddenException('This account is managed through the server .env file.');
    }
    this.assertMayManageRole(actor, user.role);

    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({ where: { id }, data: { status: dto.status }, include: USER_INCLUDE }),
      // Deactivated accounts lose their sessions immediately.
      ...(dto.status === 'ACTIVE'
        ? []
        : [this.prisma.refreshToken.updateMany({ where: { userId: id, isRevoked: false }, data: { isRevoked: true } })]),
    ]);
    return this.toView(updated);
  }

  /** Only the super admin may create or manage admins; nobody manages the super admin from the app. */
  private assertMayManageRole(actor: AuthUser, role: UserRole) {
    if (role === UserRole.SUPER_ADMIN) throw new ForbiddenException('The super admin is managed through the server .env file.');
    if (role === UserRole.ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only the super admin can manage administrator accounts.');
    }
  }

  private toView(u: UserRow) {
    const department = u.student?.department.code ?? u.faculty?.department.code ?? null;
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
      department,
      program: u.student?.program.code ?? null,
      identifier: u.student?.rollNumber ?? u.faculty?.employeeCode ?? u.adminProfile?.employeeId ?? null,
      designation: u.faculty?.designation ?? u.adminProfile?.designation ?? null,
      managedByEnv: Boolean(u.adminProfile && MANAGED_IDS.has(u.adminProfile.employeeId)),
    };
  }
}
