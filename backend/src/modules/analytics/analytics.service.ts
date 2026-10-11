import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { JobApplicationStatus, LeaveStatus, PaymentStatus, PetitionStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { ATTENDANCE_THRESHOLD } from '../../common/utils/attendance-policy';

const round1 = (n: number | null | undefined) => (n == null ? null : Math.round(n * 10) / 10);

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /** Campus-wide KPIs, all computed from live data. */
  async getAdminExecutiveSummary() {
    const activeStudent = { deletedAt: null };
    const [students, faculty, departments, attendance, debarred, fees, collected, offers] = await Promise.all([
      this.prisma.student.count({ where: activeStudent }),
      this.prisma.faculty.count({ where: { deletedAt: null } }),
      this.prisma.department.count(),
      this.prisma.student.aggregate({ where: activeStudent, _avg: { overallAttendance: true } }),
      this.prisma.student.count({ where: { ...activeStudent, isDebarred: true } }),
      this.prisma.studentFee.aggregate({ _sum: { totalAmount: true, paidAmount: true } }),
      this.prisma.feeTransaction.aggregate({ where: { status: PaymentStatus.SUCCESS }, _sum: { amount: true } }),
      this.prisma.jobApplication.count({ where: { status: JobApplicationStatus.OFFERED } }),
    ]);

    const totalBilled = fees._sum.totalAmount ?? 0;
    const totalPaid = fees._sum.paidAmount ?? 0;
    return {
      totalEnrolledStudents: students,
      activeFacultyCount: faculty,
      departmentsCount: departments,
      overallCampusAttendance: round1(attendance._avg.overallAttendance),
      debarredStudentsCount: debarred,
      totalFeeBilled: totalBilled,
      totalFeeCollected: collected._sum.amount ?? 0,
      feeCollectionRate: totalBilled > 0 ? round1((totalPaid / totalBilled) * 100) : null,
      placementOffersCount: offers,
    };
  }

  /** Department KPIs for a HOD. */
  async getHodDepartmentSummary(departmentCode: string, user: AuthUser) {
    const department = await this.prisma.department.findUnique({ where: { code: departmentCode.toUpperCase() } });
    if (!department) throw new NotFoundException(`Department ${departmentCode} not found.`);
    // HODs see only their own department; admins see all.
    if (user.role === UserRole.HOD && user.departmentId !== department.id) {
      throw new ForbiddenException('You can only view analytics for your own department.');
    }

    const inDept = { departmentId: department.id, deletedAt: null };
    const [students, faculty, attendance, lowAttendance, pendingLeaves, pendingPetitions] = await Promise.all([
      this.prisma.student.count({ where: inDept }),
      this.prisma.faculty.count({ where: inDept }),
      this.prisma.student.aggregate({ where: inDept, _avg: { overallAttendance: true } }),
      this.prisma.student.count({ where: { ...inDept, overallAttendance: { lt: ATTENDANCE_THRESHOLD } } }),
      this.prisma.leaveRequest.count({
        where: {
          status: LeaveStatus.PENDING,
          user: { OR: [{ student: { departmentId: department.id } }, { faculty: { departmentId: department.id } }] },
        },
      }),
      this.prisma.attendancePetition.count({ where: { status: PetitionStatus.PENDING, student: { departmentId: department.id } } }),
    ]);

    return {
      department: department.code,
      departmentName: department.name,
      totalStudents: students,
      totalFaculty: faculty,
      averageAttendance: round1(attendance._avg.overallAttendance),
      lowAttendanceCount: lowAttendance,
      pendingLeaveRequests: pendingLeaves,
      pendingCorrectionPetitions: pendingPetitions,
    };
  }
}
