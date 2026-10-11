import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BCRYPT_ROUNDS_PASSWORD } from '../auth/auth.constants';
import { BOOTSTRAP_EMPLOYEE_IDS } from './admin-bootstrap.service';

const PROFILE_INCLUDE = {
  adminProfile: true,
  student: {
    include: {
      department: { select: { code: true, name: true } },
      program: { select: { code: true, name: true, totalSemesters: true, degreeType: true } },
      section: { select: { name: true, academicYear: true } },
      hostelAllocation: { include: { bed: { include: { room: { include: { building: { select: { name: true } } } } } } } },
      busPass: { include: { bus: { include: { route: { select: { routeNumber: true, name: true } } } } } },
      fees: { select: { pendingAmount: true, dueDate: true } },
    },
  },
  faculty: {
    include: {
      department: { select: { code: true, name: true } },
      subjectAssignments: { include: { subject: { select: { code: true, name: true, semester: true } } } },
    },
  },
} satisfies Prisma.UserInclude;

const MANAGED_IDS = new Set<string>(Object.values(BOOTSTRAP_EMPLOYEE_IDS));
const isoDate = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : null);

/** The signed-in user's own record, in full, for the profile screens. */
@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId }, include: PROFILE_INCLUDE });
    if (!u) throw new NotFoundException('Account not found.');

    const s = u.student;
    const f = u.faculty;
    const pendingDues = s ? s.fees.reduce((sum, fee) => sum + fee.pendingAmount, 0) : null;
    const now = new Date();

    return {
      account: {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        status: u.status,
        memberSince: isoDate(u.createdAt),
        // .env-managed admins change their credentials on the server, not in the app.
        managedByEnv: Boolean(u.adminProfile && MANAGED_IDS.has(u.adminProfile.employeeId)),
      },
      student: s && {
        rollNumber: s.rollNumber,
        enrollmentNumber: s.enrollmentNumber,
        department: s.department,
        program: { code: s.program.code, name: s.program.name, degreeType: s.program.degreeType },
        section: s.section ? `${s.section.name} · ${s.section.academicYear}` : null,
        semester: s.semester,
        totalSemesters: s.program.totalSemesters,
        admissionYear: s.admissionYear,
        cgpa: s.cgpa,
        overallAttendance: s.overallAttendance,
        isDebarred: s.isDebarred,
        kycVerified: s.kycVerified,
        guardianName: s.guardianName,
        guardianPhone: s.guardianPhone,
        fees: {
          pendingDues,
          overdue: s.fees.some((fee) => fee.pendingAmount > 0 && fee.dueDate < now),
        },
        hostel: s.hostelAllocation
          ? {
              building: s.hostelAllocation.bed.room.building.name,
              room: s.hostelAllocation.bed.room.roomNumber,
              bed: s.hostelAllocation.bed.bedNumber,
            }
          : null,
        transport: s.busPass
          ? {
              route: `${s.busPass.bus.route.routeNumber} · ${s.busPass.bus.route.name}`,
              bus: s.busPass.bus.busNumber,
              pickupStop: s.busPass.pickupStop,
              passNumber: s.busPass.passNumber,
              validUntil: isoDate(s.busPass.validUntil),
            }
          : null,
      },
      faculty: f && {
        employeeCode: f.employeeCode,
        department: f.department,
        designation: f.designation,
        qualification: f.qualification,
        specialization: f.specialization,
        weeklyHoursNorm: f.aicteComplianceHours,
        subjects: f.subjectAssignments.map((a) => ({ code: a.subject.code, name: a.subject.name, semester: a.subject.semester })),
      },
      staff:
        u.adminProfile && !MANAGED_IDS.has(u.adminProfile.employeeId)
          ? { employeeId: u.adminProfile.employeeId, designation: u.adminProfile.designation }
          : u.adminProfile
            ? { employeeId: null, designation: u.adminProfile.designation }
            : null,
    };
  }

  /** Changes the caller's own password. Other sessions are signed out; this one keeps working until its token expires. */
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { adminProfile: true } });
    if (!user) throw new NotFoundException('Account not found.');
    if (user.adminProfile && MANAGED_IDS.has(user.adminProfile.employeeId)) {
      throw new ForbiddenException('This account’s password is set in the server .env file.');
    }
    if (!(await bcrypt.compare(oldPassword, user.passwordHash))) {
      throw new UnauthorizedException('Your current password is incorrect.');
    }
    if (await bcrypt.compare(newPassword, user.passwordHash)) {
      throw new BadRequestException('Choose a password different from your current one.');
    }
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS_PASSWORD) } }),
      this.prisma.refreshToken.updateMany({ where: { userId, isRevoked: false }, data: { isRevoked: true } }),
    ]);
    return { passwordChanged: true };
  }
}
