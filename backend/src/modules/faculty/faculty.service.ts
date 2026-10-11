import { Injectable, NotFoundException } from '@nestjs/common';
import { AttendanceStatus, LeaveStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { campusNow, slotStatus } from '../../common/utils/campus-clock';

const FACULTY_INCLUDE = {
  user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
  department: { select: { name: true } },
  timetableEntries: { include: { subject: true, room: true, section: true }, orderBy: { period: 'asc' } },
} satisfies Prisma.FacultyInclude;

type FacultyRow = Prisma.FacultyGetPayload<{ include: typeof FACULTY_INCLUDE }>;

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class FacultyService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const faculty = await this.prisma.faculty.findMany({
      where: { deletedAt: null },
      include: FACULTY_INCLUDE,
      orderBy: { employeeCode: 'asc' },
    });
    const onLeave = await this.usersOnLeaveToday(faculty.map((f) => f.user.id));
    return faculty.map((f) => this.toView(f, onLeave.has(f.user.id)));
  }

  async findById(idOrEmployeeCode: string) {
    const faculty = await this.prisma.faculty.findFirst({
      where: { deletedAt: null, OR: [{ id: idOrEmployeeCode }, { employeeCode: idOrEmployeeCode }] },
      include: FACULTY_INCLUDE,
    });
    if (!faculty) throw new NotFoundException(`Faculty member ${idOrEmployeeCode} not found.`);
    const onLeave = await this.usersOnLeaveToday([faculty.user.id]);
    return this.toView(faculty, onLeave.has(faculty.user.id));
  }

  /** Weekly contact hours (one per timetable period) against the AICTE requirement. */
  async getWorkload(facultyId: string) {
    const f = await this.findById(facultyId);
    return {
      facultyId: f.id,
      name: f.name,
      department: f.department,
      weeklyContactHours: f.weeklyWorkloadHours,
      aicteStandardHours: f.maxWorkloadHours,
      compliancePercentage:
        f.maxWorkloadHours > 0 ? Math.min(100, Math.round((f.weeklyWorkloadHours / f.maxWorkloadHours) * 1000) / 10) : null,
      assignedClasses: f.assignedClasses,
    };
  }

  /** Today's classes (campus time) with class size and how many students are already marked present. */
  async getTodayClasses(facultyId: string) {
    const now = campusNow();
    if (!now.dayCode) return [];

    const entries = await this.prisma.timetableEntry.findMany({
      where: { facultyId, dayOfWeek: now.dayCode },
      include: { subject: true, room: true, section: { include: { _count: { select: { students: true } } } } },
      orderBy: { period: 'asc' },
    });
    if (entries.length === 0) return [];

    const sessions = await this.prisma.attendanceSession.findMany({
      where: {
        date: startOfToday(),
        OR: entries.map((e) => ({ subjectId: e.subjectId, sectionId: e.sectionId, period: e.period })),
      },
      include: {
        _count: { select: { records: { where: { status: { in: [AttendanceStatus.PRESENT, AttendanceStatus.EXCUSED] } } } } },
      },
    });
    const sessionKey = (subjectId: string, sectionId: string, period: number) => `${subjectId}|${sectionId}|${period}`;
    const presentBySlot = new Map(sessions.map((s) => [sessionKey(s.subjectId, s.sectionId, s.period), s._count.records]));

    return entries.map((t) => ({
      id: t.id,
      period: t.period,
      time: `${t.startTime} - ${t.endTime}`,
      subjectCode: t.subject.code,
      subjectName: t.subject.name,
      section: t.section.name,
      room: t.room.roomNumber,
      totalStudents: t.section._count.students,
      markedPresent: presentBySlot.get(sessionKey(t.subjectId, t.sectionId, t.period)) ?? 0,
      status: slotStatus(t.dayOfWeek, t.startTime, t.endTime, now),
    }));
  }

  private async usersOnLeaveToday(userIds: string[]): Promise<Set<string>> {
    const now = new Date();
    const leaves = await this.prisma.leaveRequest.findMany({
      where: { userId: { in: userIds }, status: LeaveStatus.APPROVED, startDate: { lte: now }, endDate: { gte: now } },
      select: { userId: true },
    });
    return new Set(leaves.map((l) => l.userId));
  }

  private toView(f: FacultyRow, isOnLeave: boolean) {
    const assignedClasses = f.timetableEntries.map((t) => ({
      day: t.dayOfWeek,
      period: t.period,
      time: `${t.startTime} - ${t.endTime}`,
      code: t.subject.code,
      name: t.subject.name,
      section: t.section.name,
      room: t.room.roomNumber,
    }));

    const subjects = new Map<string, { code: string; name: string; semester: number; section: string }>();
    for (const t of f.timetableEntries) {
      subjects.set(`${t.subject.code}|${t.section.name}`, {
        code: t.subject.code,
        name: t.subject.name,
        semester: t.subject.semester,
        section: t.section.name,
      });
    }

    return {
      id: f.id,
      employeeId: f.employeeCode,
      name: f.user.name,
      email: f.user.email,
      phone: f.user.phone,
      avatarUrl: f.user.avatarUrl,
      department: f.department.name,
      designation: f.designation,
      qualification: f.qualification,
      specialization: f.specialization,
      // Each timetable period is one contact hour.
      weeklyWorkloadHours: f.timetableEntries.length,
      maxWorkloadHours: f.aicteComplianceHours,
      activePeriodsCount: f.timetableEntries.length,
      assignedClasses,
      assignedSubjects: [...subjects.values()],
      status: isOnLeave ? ('ON_LEAVE' as const) : ('ACTIVE' as const),
    };
  }
}
