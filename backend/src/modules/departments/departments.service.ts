import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import {
  CreateDepartmentDto,
  CreateProgramDto,
  CreateSectionDto,
  CreateSubjectDto,
  UpdateDepartmentDto,
  UpdateProgramDto,
  UpdateSectionDto,
  UpdateSubjectDto,
} from './dto/departments.dto';

const DEPARTMENT_INCLUDE = {
  facultyMembers: { where: { deletedAt: null }, include: { user: { select: { name: true, email: true } } } },
  programs: { select: { name: true } },
  _count: { select: { students: { where: { deletedAt: null } } } },
} satisfies Prisma.DepartmentInclude;

type DepartmentRow = Prisma.DepartmentGetPayload<{ include: typeof DEPARTMENT_INCLUDE }>;

/** The HOD is the faculty member whose designation names them head of department. */
function findHod(d: DepartmentRow) {
  return d.facultyMembers.find((f) => /\b(head|hod)\b/i.test(f.designation)) ?? null;
}

/** "3 students and 2 courses" — names whatever still depends on a record. */
function describeDependents(counts: Record<string, number>, labels: Record<string, [string, string]>) {
  const parts = Object.entries(counts)
    .filter(([, n]) => n > 0)
    .map(([key, n]) => `${n} ${labels[key]?.[n === 1 ? 0 : 1] ?? key}`);
  if (parts.length === 0) return null;
  return parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  // ── Departments ────────────────────────────────────────────────────────────

  async findAll() {
    const departments = await this.prisma.department.findMany({
      include: DEPARTMENT_INCLUDE,
      orderBy: { code: 'asc' },
    });
    const attendance = await this.averageAttendanceByDepartment(departments.map((d) => d.id));
    return departments.map((d) => this.toView(d, attendance.get(d.id) ?? null));
  }

  async findById(idOrCode: string) {
    const department = await this.prisma.department.findFirst({
      where: { OR: [{ id: idOrCode }, { code: idOrCode.toUpperCase() }] },
      include: DEPARTMENT_INCLUDE,
    });
    if (!department) throw new NotFoundException(`Department ${idOrCode} not found.`);

    const attendance = await this.averageAttendanceByDepartment([department.id]);
    return this.toView(department, attendance.get(department.id) ?? null);
  }

  async create(dto: CreateDepartmentDto) {
    const created = await this.unique(
      () =>
        this.prisma.department.create({
          data: {
            name: dto.name,
            code: dto.code,
            building: dto.building,
            nbaAccredited: dto.nbaAccredited ?? false,
            budgetAllocated: dto.budgetAllocated ?? 0,
          },
        }),
      `A department with code ${dto.code} already exists.`,
    );
    return this.findById(created.id);
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    await this.requireDepartment(id);
    await this.unique(
      () => this.prisma.department.update({ where: { id }, data: dto }),
      `A department with code ${dto.code} already exists.`,
    );
    return this.findById(id);
  }

  async remove(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { programs: true, subjects: true, facultyMembers: true, students: true } } },
    });
    if (!department) throw new NotFoundException('Department not found.');
    const blockers = describeDependents(department._count, {
      programs: ['program', 'programs'],
      subjects: ['course', 'courses'],
      facultyMembers: ['faculty member', 'faculty members'],
      students: ['student', 'students'],
    });
    if (blockers) throw new ConflictException(`${department.name} still has ${blockers}. Remove or move them first.`);
    await this.prisma.department.delete({ where: { id } });
    return { id, deleted: true };
  }

  // ── Programs ───────────────────────────────────────────────────────────────

  async listPrograms() {
    const programs = await this.prisma.program.findMany({
      include: {
        department: { select: { code: true } },
        _count: { select: { students: { where: { deletedAt: null } }, subjects: true } },
      },
      orderBy: { code: 'asc' },
    });
    return programs.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      departmentId: p.departmentId,
      departmentCode: p.department.code,
      durationYears: p.durationYears,
      totalSemesters: p.totalSemesters,
      degreeType: p.degreeType,
      studentCount: p._count.students,
      subjectCount: p._count.subjects,
    }));
  }

  async createProgram(dto: CreateProgramDto, actor: AuthUser) {
    this.assertMayManageDepartment(actor, dto.departmentId);
    await this.requireDepartment(dto.departmentId);
    this.assertSemesters(dto.durationYears, dto.totalSemesters);
    await this.unique(() => this.prisma.program.create({ data: dto }), `A program with code ${dto.code} already exists.`);
    return this.listPrograms();
  }

  async updateProgram(id: string, dto: UpdateProgramDto, actor: AuthUser) {
    const program = await this.requireProgram(id);
    this.assertMayManageDepartment(actor, program.departmentId);
    const durationYears = dto.durationYears ?? program.durationYears;
    const totalSemesters = dto.totalSemesters ?? program.totalSemesters;
    this.assertSemesters(durationYears, totalSemesters);

    if (dto.totalSemesters !== undefined) {
      const beyond = await this.prisma.subject.count({ where: { programId: id, semester: { gt: totalSemesters } } });
      if (beyond) throw new BadRequestException(`${beyond} course(s) are scheduled after semester ${totalSemesters}. Update them first.`);
    }
    await this.unique(() => this.prisma.program.update({ where: { id }, data: dto }), `A program with code ${dto.code} already exists.`);
    return this.listPrograms();
  }

  async removeProgram(id: string, actor: AuthUser) {
    const program = await this.prisma.program.findUnique({
      where: { id },
      include: { _count: { select: { students: true, subjects: true, feeStructures: true } } },
    });
    if (!program) throw new NotFoundException('Program not found.');
    this.assertMayManageDepartment(actor, program.departmentId);
    const blockers = describeDependents(program._count, {
      students: ['student', 'students'],
      subjects: ['course', 'courses'],
      feeStructures: ['fee structure', 'fee structures'],
    });
    if (blockers) throw new ConflictException(`${program.name} still has ${blockers}. Remove or move them first.`);
    await this.prisma.program.delete({ where: { id } });
    return this.listPrograms();
  }

  // ── Courses (subjects) ─────────────────────────────────────────────────────

  async getCurriculum() {
    const subjects = await this.prisma.subject.findMany({
      orderBy: [{ semester: 'asc' }, { code: 'asc' }],
      include: { department: { select: { code: true } }, program: { select: { code: true } } },
    });
    return subjects.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      credits: s.credits,
      type: s.type,
      semester: s.semester,
      department: s.department.code,
      departmentId: s.departmentId,
      programId: s.programId,
      program: s.program.code,
    }));
  }

  async createSubject(dto: CreateSubjectDto, actor: AuthUser) {
    const program = await this.requireProgram(dto.programId);
    this.assertMayManageDepartment(actor, program.departmentId);
    if (dto.semester > program.totalSemesters) {
      throw new BadRequestException(`${program.name} has only ${program.totalSemesters} semesters.`);
    }
    await this.unique(
      () => this.prisma.subject.create({ data: { ...dto, departmentId: program.departmentId } }),
      `A course with code ${dto.code} already exists.`,
    );
    return this.getCurriculum();
  }

  async updateSubject(id: string, dto: UpdateSubjectDto, actor: AuthUser) {
    const subject = await this.prisma.subject.findUnique({ where: { id }, include: { program: true } });
    if (!subject) throw new NotFoundException('Course not found.');
    this.assertMayManageDepartment(actor, subject.departmentId);
    if (dto.semester !== undefined && dto.semester > subject.program.totalSemesters) {
      throw new BadRequestException(`${subject.program.name} has only ${subject.program.totalSemesters} semesters.`);
    }
    await this.unique(() => this.prisma.subject.update({ where: { id }, data: dto }), `A course with code ${dto.code} already exists.`);
    return this.getCurriculum();
  }

  async removeSubject(id: string, actor: AuthUser) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            facultyAssignments: true,
            timetableEntries: true,
            attendanceSessions: true,
            assessments: true,
            assignments: true,
            materials: true,
            examSchedules: true,
          },
        },
      },
    });
    if (!subject) throw new NotFoundException('Course not found.');
    this.assertMayManageDepartment(actor, subject.departmentId);
    const blockers = describeDependents(subject._count, {
      facultyAssignments: ['faculty assignment', 'faculty assignments'],
      timetableEntries: ['timetable slot', 'timetable slots'],
      attendanceSessions: ['attendance session', 'attendance sessions'],
      assessments: ['assessment', 'assessments'],
      assignments: ['assignment', 'assignments'],
      materials: ['study material', 'study materials'],
      examSchedules: ['exam schedule', 'exam schedules'],
    });
    if (blockers) throw new ConflictException(`${subject.code} is still used by ${blockers}, so it can't be deleted.`);
    await this.prisma.subject.delete({ where: { id } });
    return this.getCurriculum();
  }

  // ── Sections ───────────────────────────────────────────────────────────────

  async listSections() {
    const sections = await this.prisma.section.findMany({
      include: { _count: { select: { students: { where: { deletedAt: null } } } } },
      orderBy: [{ academicYear: 'desc' }, { semester: 'asc' }, { name: 'asc' }],
    });
    return sections.map((s) => ({
      id: s.id,
      name: s.name,
      semester: s.semester,
      academicYear: s.academicYear,
      capacity: s.capacity,
      studentCount: s._count.students,
    }));
  }

  async createSection(dto: CreateSectionDto) {
    this.assertAcademicYear(dto.academicYear);
    await this.assertSectionNameFree(dto.name, dto.academicYear);
    await this.prisma.section.create({ data: dto });
    return this.listSections();
  }

  async updateSection(id: string, dto: UpdateSectionDto) {
    const section = await this.prisma.section.findUnique({
      where: { id },
      include: { _count: { select: { students: { where: { deletedAt: null } } } } },
    });
    if (!section) throw new NotFoundException('Section not found.');
    if (dto.academicYear) this.assertAcademicYear(dto.academicYear);
    const name = dto.name ?? section.name;
    const academicYear = dto.academicYear ?? section.academicYear;
    if (name !== section.name || academicYear !== section.academicYear) await this.assertSectionNameFree(name, academicYear, id);
    if (dto.capacity !== undefined && dto.capacity < section._count.students) {
      throw new BadRequestException(`${section._count.students} students are already in this section.`);
    }
    await this.prisma.section.update({ where: { id }, data: dto });
    return this.listSections();
  }

  async removeSection(id: string) {
    const section = await this.prisma.section.findUnique({
      where: { id },
      include: { _count: { select: { students: true, timetable: true, attendance: true, assignments: true } } },
    });
    if (!section) throw new NotFoundException('Section not found.');
    const blockers = describeDependents(section._count, {
      students: ['student', 'students'],
      timetable: ['timetable slot', 'timetable slots'],
      attendance: ['attendance session', 'attendance sessions'],
      assignments: ['assignment', 'assignments'],
    });
    if (blockers) throw new ConflictException(`Section ${section.name} still has ${blockers}. Move them first.`);
    await this.prisma.section.delete({ where: { id } });
    return this.listSections();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** HODs manage programs and courses of their own department only; admins manage all. */
  private assertMayManageDepartment(actor: AuthUser, departmentId: string) {
    if (actor.role === UserRole.HOD && actor.departmentId !== departmentId) {
      throw new ForbiddenException('Heads of department can only manage their own department.');
    }
  }

  private async requireDepartment(id: string) {
    const department = await this.prisma.department.findUnique({ where: { id } });
    if (!department) throw new NotFoundException('Department not found.');
    return department;
  }

  private async requireProgram(id: string) {
    const program = await this.prisma.program.findUnique({ where: { id } });
    if (!program) throw new NotFoundException('Program not found.');
    return program;
  }

  private assertSemesters(durationYears: number, totalSemesters: number) {
    if (totalSemesters > durationYears * 2) {
      throw new BadRequestException('A program cannot have more than two semesters per year.');
    }
  }

  private assertAcademicYear(academicYear: string) {
    const [start, end] = academicYear.split('-').map(Number);
    if (end !== start + 1) throw new BadRequestException('academicYear must span two consecutive years, e.g. 2026-2027.');
  }

  private async assertSectionNameFree(name: string, academicYear: string, exceptId?: string) {
    const existing = await this.prisma.section.findFirst({
      where: { name, academicYear, ...(exceptId && { id: { not: exceptId } }) },
    });
    if (existing) throw new ConflictException(`Section ${name} already exists for ${academicYear}.`);
  }

  private async unique<T>(write: () => Promise<T>, conflictMessage: string) {
    try {
      return await write();
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') throw new ConflictException(conflictMessage);
      throw err;
    }
  }

  private async averageAttendanceByDepartment(departmentIds: string[]) {
    const rows = await this.prisma.student.groupBy({
      by: ['departmentId'],
      where: { departmentId: { in: departmentIds }, deletedAt: null },
      _avg: { overallAttendance: true },
    });
    return new Map(
      rows.map((r) => [r.departmentId, r._avg.overallAttendance == null ? null : Math.round(r._avg.overallAttendance * 10) / 10]),
    );
  }

  private toView(d: DepartmentRow, averageAttendance: number | null) {
    const hod = findHod(d);
    const facultyCount = d.facultyMembers.length;
    const studentCount = d._count.students;
    return {
      id: d.id,
      code: d.code,
      name: d.name,
      building: d.building,
      hodName: hod?.user.name ?? null,
      hodEmail: hod?.user.email ?? null,
      facultyCount,
      studentCount,
      fsrRatio: facultyCount > 0 ? `1:${(studentCount / facultyCount).toFixed(1)}` : null,
      nbaAccredited: d.nbaAccredited,
      accreditationStatus: d.nbaAccredited ? 'NBA Accredited' : 'Not Accredited',
      programs: d.programs.map((p) => p.name),
      budgetAllocated: d.budgetAllocated,
      budgetSpent: d.budgetSpent,
      budgetUtilization: d.budgetAllocated > 0 ? Math.round((d.budgetSpent / d.budgetAllocated) * 100) : null,
      averageAttendance,
    };
  }
}
