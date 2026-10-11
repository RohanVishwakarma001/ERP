import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExaminationsService } from './examinations.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { interleaveByGroup, seatPositions } from './seating';

describe('Seating allocation', () => {
  it('interleaves departments so neighbours differ wherever possible', () => {
    const students = [
      ...['c1', 'c2', 'c3'].map((id) => ({ id, dept: 'CSE' })),
      ...['e1', 'e2'].map((id) => ({ id, dept: 'ECE' })),
      { id: 'm1', dept: 'ME' },
    ];
    const order = interleaveByGroup(students, (s) => s.dept).map((s) => s.dept);
    expect(order).toEqual(['CSE', 'ECE', 'ME', 'CSE', 'ECE', 'CSE']);
    for (let i = 1; i < order.length; i++) expect(order[i]).not.toBe(order[i - 1]);
  });

  it('lays seats out row-major', () => {
    expect(seatPositions(8, 6).map((s) => s.seatNumber)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'B1', 'B2']);
  });
});

describe('ExaminationsService', () => {
  let service: ExaminationsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      student: { findUnique: jest.fn(), findMany: jest.fn() },
      subject: { findUnique: jest.fn(), findMany: jest.fn() },
      section: { findFirst: jest.fn() },
      assessment: { findFirst: jest.fn(), create: jest.fn() },
      mark: { upsert: jest.fn().mockResolvedValue({}) },
      $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
    };
    service = new ExaminationsService(prisma as PrismaService);
  });

  describe('getStudentGradeCard', () => {
    const student = {
      id: 'stu-1',
      rollNumber: '220102048',
      semester: 6,
      programId: 'prog-1',
      cgpa: 8.5,
      user: { name: 'Aarav Sharma' },
      program: { name: 'B.Tech CSE' },
      results: [],
    };

    const assessment = (type: string, maxMarks: number, obtained: number | null) => ({
      type,
      maxMarks,
      marks: obtained === null ? [] : [{ marksObtained: obtained, isAbsent: false }],
    });

    it('grades from real marks and computes a credit-weighted SGPA', async () => {
      prisma.student.findUnique.mockResolvedValue(student);
      prisma.subject.findMany.mockResolvedValue([
        // 27/30 + 63/70 = 90% → O (10)
        { code: 'CS-601', name: 'Compiler Design', credits: 4, assessments: [assessment('INTERNAL_CIA_1', 30, 27), assessment('END_SEM', 70, 63)] },
        // 21/30 + 35/70 = 56% → B (6)
        { code: 'CS-602', name: 'Cloud', credits: 2, assessments: [assessment('INTERNAL_CIA_1', 30, 21), assessment('END_SEM', 70, 35)] },
        // no marks yet
        { code: 'CS-603', name: 'ML', credits: 4, assessments: [assessment('INTERNAL_CIA_1', 30, null)] },
      ]);

      const card = await service.getStudentGradeCard('stu-1');

      expect(card.subjects[0]).toMatchObject({ internalMarks: 27, externalMarks: 63, grade: 'O', status: 'PASS' });
      expect(card.subjects[1]).toMatchObject({ grade: 'B', gradePoints: 6 });
      expect(card.subjects[2]).toMatchObject({ status: 'PENDING', grade: null });
      expect(card.sgpa).toBe(8.67); // (4·10 + 2·6) / 6
      expect(card.totalCreditsEarned).toBe(6);
      expect(card.resultStatus).toBe('NOT_PUBLISHED');
    });

    it('prefers the officially published SGPA when a result exists', async () => {
      prisma.student.findUnique.mockResolvedValue({
        ...student,
        results: [{ semester: 5, sgpa: 9.1, cgpa: 8.9, totalCreditsEarned: 22, status: 'PUBLISHED', academicYear: '2025-2026' }],
      });
      prisma.subject.findMany.mockResolvedValue([]);

      const card = await service.getStudentGradeCard('stu-1');

      expect(card.semester).toBe(5);
      expect(card.sgpa).toBe(9.1);
      expect(card.cgpa).toBe(8.9);
    });

    it('throws NotFound for an unknown student', async () => {
      prisma.student.findUnique.mockResolvedValue(null);
      await expect(service.getStudentGradeCard('nobody')).rejects.toThrow(NotFoundException);
    });
  });

  describe('recordMarks', () => {
    it('rejects marks above the maximum before writing anything', async () => {
      prisma.subject.findUnique.mockResolvedValue({ id: 'sub-1', code: 'CS-601' });
      await expect(
        service.recordMarks({
          subjectCode: 'CS-601',
          assessmentType: 'INTERNAL_CIA_1',
          maxMarks: 30,
          records: [{ studentId: 's1', marksObtained: 31 }],
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.mark.upsert).not.toHaveBeenCalled();
    });

    it('upserts one mark per student against a single assessment', async () => {
      prisma.subject.findUnique.mockResolvedValue({ id: 'sub-1', code: 'CS-601' });
      prisma.assessment.findFirst.mockResolvedValue({ id: 'as-1' });

      const res = await service.recordMarks({
        subjectCode: 'CS-601',
        assessmentType: 'INTERNAL_CIA_1',
        maxMarks: 30,
        records: [
          { studentId: 's1', marksObtained: 25 },
          { studentId: 's2', marksObtained: 0, isAbsent: true },
        ],
      });

      expect(res.savedCount).toBe(2);
      expect(prisma.mark.upsert).toHaveBeenCalledTimes(2);
      expect(prisma.assessment.create).not.toHaveBeenCalled();
    });
  });
});
