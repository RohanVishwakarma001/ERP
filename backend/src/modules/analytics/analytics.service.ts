import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getAdminExecutiveSummary() {
    return {
      academicYear: '2025-2026',
      totalEnrolledStudents: 1840,
      activeFacultyCount: 114,
      departmentsCount: 6,
      overallCampusAttendance: 83.2,
      debarredStudentsCount: 42,
      totalFeeCollected: 84250000,
      feeCollectionRate: 94.6,
      placementOffersCount: 312,
      highestPackage: '₹24.50 LPA',
      averagePackage: '₹6.80 LPA',
      campusNodesActive: '12 / 12 Nodes Online (UTU Cloud Sync Active)',
      monthlyAttendanceTrend: [
        { month: 'Jan', percentage: 86.4 },
        { month: 'Feb', percentage: 84.1 },
        { month: 'Mar', percentage: 85.0 },
        { month: 'Apr', percentage: 82.3 },
        { month: 'May', percentage: 83.2 },
      ],
    };
  }

  async getHodDepartmentSummary(departmentCode = 'CSE') {
    return {
      department: departmentCode,
      totalStudents: 480,
      totalFaculty: 32,
      averageAttendance: 84.5,
      lowAttendanceCount: 14,
      syllabusCompletion: 81.2,
      aicteComplianceRate: 100.0,
      pendingLeaveRequests: 3,
      pendingCorrectionPetitions: 3,
    };
  }
}
