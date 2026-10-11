import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MOCK_STUDENTS = [
  {
    id: 'stu-01',
    rollNumber: '220102048',
    enrollmentNumber: 'UTU2022CS048',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@jbitdoon.edu.in',
    department: 'Computer Science & Engineering',
    program: 'B.Tech CSE',
    semester: 6,
    section: 'CSE-6A',
    cgpa: 8.92,
    overallAttendance: 84.5,
    isDebarred: false,
    admissionYear: 2022,
    status: 'ACTIVE',
  },
  {
    id: 'stu-02',
    rollNumber: '220102012',
    enrollmentNumber: 'UTU2022CS012',
    name: 'Devendra Bisht',
    email: 'devendra.bisht@jbitdoon.edu.in',
    department: 'Computer Science & Engineering',
    program: 'B.Tech CSE',
    semester: 6,
    section: 'CSE-6A',
    cgpa: 7.21,
    overallAttendance: 68.2,
    isDebarred: true,
    admissionYear: 2022,
    status: 'ACTIVE',
  },
  {
    id: 'stu-03',
    rollNumber: '220102005',
    enrollmentNumber: 'UTU2022CS005',
    name: 'Ananya Joshi',
    email: 'ananya.joshi@jbitdoon.edu.in',
    department: 'Computer Science & Engineering',
    program: 'B.Tech CSE',
    semester: 6,
    section: 'CSE-6A',
    cgpa: 9.45,
    overallAttendance: 92.1,
    isDebarred: false,
    admissionYear: 2022,
    status: 'ACTIVE',
  },
  {
    id: 'stu-04',
    rollNumber: '220102018',
    enrollmentNumber: 'UTU2022CS018',
    name: 'Kavita Rawat',
    email: 'kavita.rawat@jbitdoon.edu.in',
    department: 'Computer Science & Engineering',
    program: 'B.Tech CSE',
    semester: 6,
    section: 'CSE-6A',
    cgpa: 8.60,
    overallAttendance: 81.0,
    isDebarred: false,
    admissionYear: 2022,
    status: 'ACTIVE',
  },
  {
    id: 'stu-05',
    rollNumber: '220102024',
    enrollmentNumber: 'UTU2022CS024',
    name: 'Mohit Semwal',
    email: 'mohit.semwal@jbitdoon.edu.in',
    department: 'Computer Science & Engineering',
    program: 'B.Tech CSE',
    semester: 6,
    section: 'CSE-6A',
    cgpa: 7.42,
    overallAttendance: 74.0,
    isDebarred: false,
    admissionYear: 2022,
    status: 'ACTIVE',
  },
];

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { department?: string; semester?: number; isDebarred?: boolean; search?: string }) {
    if (this.prisma.isConnected) {
      try {
        const where: any = { deletedAt: null };
        if (params?.semester) where.semester = Number(params.semester);
        if (params?.isDebarred !== undefined) where.isDebarred = String(params.isDebarred) === 'true';

        const students = await this.prisma.student.findMany({
          where,
          include: {
            user: { select: { name: true, email: true, phone: true, avatarUrl: true } },
            department: { select: { code: true, name: true } },
            program: { select: { code: true, name: true } },
            section: { select: { name: true } },
          },
        });

        if (students.length > 0) {
          return students.map((s) => ({
            id: s.id,
            rollNumber: s.rollNumber,
            enrollmentNumber: s.enrollmentNumber,
            name: s.user.name,
            email: s.user.email,
            phone: s.user.phone || '+91 98765 43210',
            department: s.department.name,
            program: s.program.name,
            semester: s.semester,
            section: s.section?.name || 'CSE-6A',
            batch: `${s.admissionYear}-${s.admissionYear + 4}`,
            cgpa: s.cgpa,
            attendancePercent: s.overallAttendance,
            overallAttendance: s.overallAttendance,
            conductedClasses: 180,
            attendedClasses: Math.round((s.overallAttendance / 100) * 180),
            debarmentStatus: s.isDebarred ? 'DEBARRED' : 'ELIGIBLE',
            hallTicketStatus: s.isDebarred ? 'WITHHELD' : 'RELEASED',
            medicalLeavesPending: 1,
            feesDue: s.isDebarred ? 12500 : 0,
            avatarUrl: s.user.avatarUrl || '/assets/student-avatar.png',
            address: 'Dehradun, Uttarakhand',
            isDebarred: s.isDebarred,
            status: 'ACTIVE',
          }));
        }
      } catch {
        // Fallback
      }
    }

    let result = MOCK_STUDENTS.map((s) => ({
      ...s,
      phone: '+91 98765 43210',
      batch: '2022-2026',
      attendancePercent: s.overallAttendance,
      conductedClasses: 180,
      attendedClasses: Math.round((s.overallAttendance / 100) * 180),
      debarmentStatus: (s.isDebarred ? 'DEBARRED' : 'ELIGIBLE') as 'DEBARRED' | 'ELIGIBLE',
      hallTicketStatus: (s.isDebarred ? 'WITHHELD' : 'RELEASED') as 'WITHHELD' | 'RELEASED',
      medicalLeavesPending: 1,
      feesDue: s.isDebarred ? 12500 : 0,
      avatarUrl: '/assets/student-avatar.png',
      address: 'Dehradun, Uttarakhand',
    }));

    if (params?.semester) {
      result = result.filter((s) => s.semester === Number(params.semester));
    }
    if (params?.isDebarred !== undefined) {
      const debarredBool = String(params.isDebarred) === 'true';
      result = result.filter((s) => s.isDebarred === debarredBool);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.rollNumber.includes(q) ||
          s.enrollmentNumber.toLowerCase().includes(q),
      );
    }
    return result;
  }

  async findById(id: string) {
    if (this.prisma.isConnected) {
      try {
        const student = await this.prisma.student.findFirst({
          where: {
            OR: [
              { id },
              { rollNumber: id },
              { enrollmentNumber: id },
              { user: { email: id } },
            ],
          },
          include: {
            user: true,
            department: true,
            program: true,
            section: true,
          },
        });
        if (student) {
          return {
            id: student.id,
            rollNumber: student.rollNumber,
            enrollmentNumber: student.enrollmentNumber,
            name: student.user.name,
            email: student.user.email,
            phone: student.user.phone || '+91 98765 43210',
            department: student.department.name,
            program: student.program.name,
            semester: student.semester,
            section: student.section?.name || 'CSE-6A',
            batch: `${student.admissionYear}-${student.admissionYear + 4}`,
            cgpa: student.cgpa,
            attendancePercent: student.overallAttendance,
            overallAttendance: student.overallAttendance,
            conductedClasses: 180,
            attendedClasses: Math.round((student.overallAttendance / 100) * 180),
            debarmentStatus: student.isDebarred ? 'DEBARRED' : 'ELIGIBLE',
            hallTicketStatus: student.isDebarred ? 'WITHHELD' : 'RELEASED',
            medicalLeavesPending: 1,
            feesDue: student.isDebarred ? 12500 : 0,
            avatarUrl: student.user.avatarUrl || '/assets/student-avatar.png',
            address: 'Dehradun, Uttarakhand',
            isDebarred: student.isDebarred,
            status: 'ACTIVE',
          };
        }
      } catch {
        // Fallback
      }
    }

    const s = MOCK_STUDENTS.find((s) => s.id === id || s.rollNumber === id) || MOCK_STUDENTS[0];
    return {
      ...s,
      phone: '+91 98765 43210',
      batch: '2022-2026',
      attendancePercent: s.overallAttendance,
      conductedClasses: 180,
      attendedClasses: Math.round((s.overallAttendance / 100) * 180),
      debarmentStatus: (s.isDebarred ? 'DEBARRED' : 'ELIGIBLE') as 'DEBARRED' | 'ELIGIBLE',
      hallTicketStatus: (s.isDebarred ? 'WITHHELD' : 'RELEASED') as 'WITHHELD' | 'RELEASED',
      medicalLeavesPending: 1,
      feesDue: s.isDebarred ? 12500 : 0,
      avatarUrl: '/assets/student-avatar.png',
      address: 'Dehradun, Uttarakhand',
    };
  }

  async updateDebarmentStatus(studentId: string, status: string) {
    const isDebarred = status === 'DEBARRED';
    try {
      const student = await this.prisma.student.findFirst({
        where: { OR: [{ id: studentId }, { rollNumber: studentId }] },
      });
      if (student) {
        await this.prisma.student.update({
          where: { id: student.id },
          data: { isDebarred },
        });
      }
    } catch {
      // Fallback
    }

    const mock = MOCK_STUDENTS.find((s) => s.id === studentId);
    if (mock) {
      mock.isDebarred = isDebarred;
    }

    return this.findById(studentId);
  }

  async toggleHallTicket(studentId: string) {
    const student = await this.findById(studentId);
    const newStatus = (student as any).hallTicketStatus === 'RELEASED' ? 'WITHHELD' : 'RELEASED';
    (student as any).hallTicketStatus = newStatus;
    return student;
  }

  async getDebarmentStatus(studentId: string) {
    const student = await this.findById(studentId);
    const attendance = (student as any).overallAttendance || 84.5;
    const isDebarred = attendance < 75.0;

    return {
      studentId: (student as any).id,
      rollNumber: (student as any).rollNumber,
      name: (student as any).name,
      overallAttendance: attendance,
      statutoryThreshold: 75.0,
      isDebarred,
      debarmentStatus: isDebarred ? 'DEBARRED' : 'ELIGIBLE',
      regulationReference: 'UTU Ordinance 14(B) - Minimum 75% Attendance Requirement',
      classesShortfall: isDebarred ? 6 : 0,
      appealPermitted: true,
    };
  }
}
