import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('DepartmentsService (academic structure permissions & safe deletes)', () => {
  let prisma: any;
  let service: DepartmentsService;

  const admin: AuthUser = { id: 'u-admin', email: 'a@x.edu', name: 'Admin', role: 'ADMIN' };
  const hodCse: AuthUser = { id: 'u-hod', email: 'h@x.edu', name: 'HOD', role: 'HOD', departmentId: 'dept-cse' };

  const program = { id: 'prog-1', name: 'B.Tech CSE', departmentId: 'dept-cse', durationYears: 4, totalSemesters: 8 };

  beforeEach(() => {
    prisma = {
      department: { findUnique: jest.fn(), delete: jest.fn() },
      program: {
        findUnique: jest.fn().mockResolvedValue(program),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      subject: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      section: { findUnique: jest.fn(), delete: jest.fn() },
    };
    service = new DepartmentsService(prisma as PrismaService);
  });

  const course = { code: 'CS-601', name: 'Compilers', credits: 4, semester: 6, type: 'THEORY' as const, programId: 'prog-1' };

  it('lets a HOD add a course to a program in their own department', async () => {
    await service.createSubject(course, hodCse);
    expect(prisma.subject.create).toHaveBeenCalledWith({ data: { ...course, departmentId: 'dept-cse' } });
  });

  it("blocks a HOD from adding a course to another department's program", async () => {
    prisma.program.findUnique.mockResolvedValue({ ...program, departmentId: 'dept-me' });
    await expect(service.createSubject(course, hodCse)).rejects.toThrow(ForbiddenException);
    expect(prisma.subject.create).not.toHaveBeenCalled();
  });

  it('lets an admin manage any department', async () => {
    prisma.program.findUnique.mockResolvedValue({ ...program, departmentId: 'dept-me' });
    await service.createSubject(course, admin);
    expect(prisma.subject.create).toHaveBeenCalled();
  });

  it('rejects a course semester beyond the program length', async () => {
    await expect(service.createSubject({ ...course, semester: 9 }, admin)).rejects.toThrow(BadRequestException);
  });

  it("blocks a HOD from creating a program in another department", async () => {
    await expect(
      service.createProgram(
        { name: 'B.Tech ME', code: 'BTECH_ME', departmentId: 'dept-me', durationYears: 4, totalSemesters: 8, degreeType: 'UNDERGRADUATE' },
        hodCse,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('refuses to delete a program that still has students or courses', async () => {
    prisma.program.findUnique.mockResolvedValue({ ...program, _count: { students: 3, subjects: 1, feeStructures: 0 } });
    await expect(service.removeProgram('prog-1', admin)).rejects.toThrow('B.Tech CSE still has 3 students and 1 course');
    expect(prisma.program.delete).not.toHaveBeenCalled();
  });

  it('deletes an unused program', async () => {
    prisma.program.findUnique.mockResolvedValue({ ...program, _count: { students: 0, subjects: 0, feeStructures: 0 } });
    await service.removeProgram('prog-1', admin);
    expect(prisma.program.delete).toHaveBeenCalledWith({ where: { id: 'prog-1' } });
  });

  it('refuses to delete a course that already has attendance or marks', async () => {
    prisma.subject.findUnique.mockResolvedValue({
      id: 's-1',
      code: 'CS-601',
      departmentId: 'dept-cse',
      _count: { facultyAssignments: 0, timetableEntries: 0, attendanceSessions: 2, assessments: 1, assignments: 0, materials: 0, examSchedules: 0 },
    });
    await expect(service.removeSubject('s-1', hodCse)).rejects.toThrow(ConflictException);
    expect(prisma.subject.delete).not.toHaveBeenCalled();
  });

  it('refuses to delete a department that still has programs', async () => {
    prisma.department.findUnique.mockResolvedValue({
      id: 'dept-cse',
      name: 'CSE',
      _count: { programs: 2, subjects: 0, facultyMembers: 0, students: 0 },
    });
    await expect(service.remove('dept-cse')).rejects.toThrow('CSE still has 2 programs');
  });

  it('refuses to shrink a program below a semester that already has courses', async () => {
    prisma.subject.count.mockResolvedValue(2);
    await expect(service.updateProgram('prog-1', { totalSemesters: 6, durationYears: 3 }, admin)).rejects.toThrow(BadRequestException);
    expect(prisma.program.update).not.toHaveBeenCalled();
  });
});
