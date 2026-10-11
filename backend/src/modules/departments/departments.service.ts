import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateDepartmentDto } from './dto/departments.dto';

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
