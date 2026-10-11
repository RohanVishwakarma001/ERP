import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateDepartmentDto, CreateProgramDto, CreateSectionDto } from './dto/departments.dto';

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

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

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

  async getCurriculum() {
    const subjects = await this.prisma.subject.findMany({
      orderBy: [{ semester: 'asc' }, { code: 'asc' }],
      include: { department: { select: { code: true } } },
    });
    return subjects.map((s) => ({
      code: s.code,
      name: s.name,
      credits: s.credits,
      type: s.type,
      semester: s.semester,
      department: s.department.code,
    }));
  }

  async create(dto: CreateDepartmentDto) {
    const created = await this.prisma.department.create({
      data: {
        name: dto.name.trim(),
        code: dto.code,
        building: dto.building.trim(),
        nbaAccredited: dto.nbaAccredited ?? false,
        budgetAllocated: dto.budgetAllocated ?? 0,
      },
    });
    return this.findById(created.id);
  }

  async listPrograms() {
    const programs = await this.prisma.program.findMany({
      include: { department: { select: { code: true } }, _count: { select: { students: { where: { deletedAt: null } } } } },
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
    }));
  }

  async createProgram(dto: CreateProgramDto) {
    if (!(await this.prisma.department.findUnique({ where: { id: dto.departmentId } }))) {
      throw new BadRequestException('The selected department no longer exists.');
    }
    if (dto.totalSemesters > dto.durationYears * 2) {
      throw new BadRequestException('A program cannot have more than two semesters per year.');
    }
    await this.createUnique(
      () => this.prisma.program.create({ data: dto }),
      `A program with code ${dto.code} already exists.`,
    );
    return this.listPrograms();
  }

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
    const [start, end] = dto.academicYear.split('-').map(Number);
    if (end !== start + 1) throw new BadRequestException('academicYear must span two consecutive years, e.g. 2026-2027.');
    const existing = await this.prisma.section.findFirst({ where: { name: dto.name, academicYear: dto.academicYear } });
    if (existing) throw new ConflictException(`Section ${dto.name} already exists for ${dto.academicYear}.`);
    await this.prisma.section.create({ data: dto });
    return this.listSections();
  }

  private async createUnique<T>(create: () => Promise<T>, conflictMessage: string) {
    try {
      return await create();
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
