import { Injectable, NotFoundException } from '@nestjs/common';
import { AttendanceStatus, FeeStatus, PetitionStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import {
  ATTENDANCE_THRESHOLD,
  classesNeededToReachThreshold,
  countsAsAttended,
} from '../../common/utils/attendance-policy';
import { DebarmentDecision, ListStudentsQueryDto } from './dto/students.dto';

const STUDENT_INCLUDE = {
  user: { select: { name: true, email: true, phone: true, avatarUrl: true } },
  department: { select: { code: true, name: true } },
  program: { select: { code: true, name: true } },
  section: { select: { name: true } },
} satisfies Prisma.StudentInclude;

type StudentRow = Prisma.StudentGetPayload<{ include: typeof STUDENT_INCLUDE }>;

interface StudentAggregates {
  attended: number;
  conducted: number;
  feesDue: number;
  pendingPetitions: number;
}

const EMPTY_AGGREGATES: StudentAggregates = { attended: 0, conducted: 0, feesDue: 0, pendingPetitions: 0 };

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: ListStudentsQueryDto = {}) {
    const where: Prisma.StudentWhereInput = { deletedAt: null };
    if (query.semester) where.semester = query.semester;
    if (query.isDebarred !== undefined) where.isDebarred = query.isDebarred;
    if (query.section) where.section = { name: query.section };
    if (query.search) {
      const q = query.search.trim();
      where.OR = [
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { rollNumber: { contains: q } },
        { enrollmentNumber: { contains: q, mode: 'insensitive' } },
      ];
    }

    const students = await this.prisma.student.findMany({
      where,
      include: STUDENT_INCLUDE,
      orderBy: { rollNumber: 'asc' },
    });
    const aggregates = await this.loadAggregates(students.map((s) => s.id));
    return students.map((s) => this.toView(s, aggregates.get(s.id) ?? EMPTY_AGGREGATES));
  }

  /** Looks up by id, roll number, enrollment number or email. */
  async findById(identifier: string) {
    const student = await this.prisma.student.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { id: identifier },
          { rollNumber: identifier },
          { enrollmentNumber: identifier },
          { user: { email: identifier } },
        ],
      },
      include: STUDENT_INCLUDE,
    });
    if (!student) throw new NotFoundException(`Student ${identifier} not found.`);

    const aggregates = await this.loadAggregates([student.id]);
    return this.toView(student, aggregates.get(student.id) ?? EMPTY_AGGREGATES);
  }

  async updateDebarmentStatus(identifier: string, status: DebarmentDecision) {
    const { id } = await this.findById(identifier);
    await this.prisma.student.update({ where: { id }, data: { isDebarred: status === 'DEBARRED' } });
    return this.findById(id);
  }

  async getDebarmentStatus(identifier: string) {
    const s = await this.findById(identifier);
    return {
      studentId: s.id,
      rollNumber: s.rollNumber,
      name: s.name,
      overallAttendance: s.attendancePercent,
      statutoryThreshold: ATTENDANCE_THRESHOLD,
      isDebarred: s.isDebarred,
      debarmentStatus: s.debarmentStatus,
      regulationReference: 'UTU Ordinance 14(B) — Minimum 75% Attendance Requirement',
      classesShortfall: classesNeededToReachThreshold(s.attendedClasses, s.conductedClasses),
    };
  }

  /** Attendance counts, outstanding fees and pending petitions for many students in three queries. */
  private async loadAggregates(studentIds: string[]): Promise<Map<string, StudentAggregates>> {
    const result = new Map<string, StudentAggregates>();
    if (studentIds.length === 0) return result;
    const get = (id: string) => {
      if (!result.has(id)) result.set(id, { ...EMPTY_AGGREGATES });
      return result.get(id)!;
    };

    const [attendance, fees, petitions] = await Promise.all([
      this.prisma.attendanceRecord.groupBy({
        by: ['studentId', 'status'],
        where: { studentId: { in: studentIds } },
        _count: { _all: true },
      }),
      this.prisma.studentFee.groupBy({
        by: ['studentId'],
        where: { studentId: { in: studentIds }, status: { not: FeeStatus.PAID } },
        _sum: { pendingAmount: true },
      }),
      this.prisma.attendancePetition.groupBy({
        by: ['studentId'],
        where: { studentId: { in: studentIds }, status: PetitionStatus.PENDING },
        _count: { _all: true },
      }),
    ]);

    for (const row of attendance) {
      const agg = get(row.studentId);
      agg.conducted += row._count._all;
      if (countsAsAttended(row.status as AttendanceStatus)) agg.attended += row._count._all;
    }
    for (const row of fees) get(row.studentId).feesDue = row._sum.pendingAmount ?? 0;
    for (const row of petitions) get(row.studentId).pendingPetitions = row._count._all;
    return result;
  }

  private toView(s: StudentRow, agg: StudentAggregates) {
    return {
      id: s.id,
      rollNumber: s.rollNumber,
      enrollmentNumber: s.enrollmentNumber,
      name: s.user.name,
      email: s.user.email,
      phone: s.user.phone,
      avatarUrl: s.user.avatarUrl,
      department: s.department.name,
      departmentCode: s.department.code,
      program: s.program.name,
      semester: s.semester,
      section: s.section?.name ?? null,
      batch: `${s.admissionYear}-${s.admissionYear + 4}`,
      cgpa: s.cgpa,
      attendancePercent: s.overallAttendance,
      conductedClasses: agg.conducted,
      attendedClasses: agg.attended,
      isDebarred: s.isDebarred,
      debarmentStatus: s.isDebarred ? ('DEBARRED' as const) : ('ELIGIBLE' as const),
      // Hall tickets are not stored separately: they are withheld exactly when the student is debarred.
      hallTicketStatus: s.isDebarred ? ('WITHHELD' as const) : ('RELEASED' as const),
      pendingAttendancePetitions: agg.pendingPetitions,
      feesDue: agg.feesDue,
      kycVerified: s.kycVerified,
    };
  }
}
