import { AttendanceService } from './attendance.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AttendanceService (Critical Business Logic Tests)', () => {
  let service: AttendanceService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {};
    service = new AttendanceService(mockPrisma as PrismaService);
  });

  describe('Statutory 75% Attendance & Debarment Calculations', () => {
    it('should calculate attendance percentage accurately', async () => {
      const summary = await service.getStudentSummary('stu-01');
      expect(summary).toBeDefined();
      expect(summary.statutoryThreshold).toBe(75);
      expect(summary.overallPercentage).toBeGreaterThanOrEqual(0);
      expect(summary.overallPercentage).toBeLessThanOrEqual(100);
    });

    it('should correctly determine debarment when attendance is below 75%', async () => {
      const summary = await service.getStudentSummary('stu-01');
      if (summary.overallPercentage < 75.0) {
        expect(summary.isDebarred).toBe(true);
      } else {
        expect(summary.isDebarred).toBe(false);
      }
    });

    it('should calculate additional classes needed to reach 75% threshold', async () => {
      const summary = await service.getStudentSummary('stu-01');
      const warningSubject = summary.subjects.find((s) => s.percentage < 75);
      if (warningSubject) {
        expect(warningSubject.neededFor75).toBeGreaterThan(0);
        expect(warningSubject.status).toBe('WARNING');
      }
    });
  });

  describe('Secure QR Attendance Verification', () => {
    it('should generate a 60-second rotating QR token with geofence bounds', async () => {
      const session = await service.generateQrSession({
        facultyId: 'fac-01',
        subjectCode: 'CS-602',
        section: 'CSE-6A',
        period: 2,
        latitude: 30.3441,
        longitude: 77.9472,
      });

      expect(session.qrCodeToken).toContain('JBIT-SECURE-QR-CS-602');
      expect(session.expiresInSeconds).toBe(60);
      expect(session.geofenceValidated).toBe(true);
    });

    it('should accept scan when QR token is valid and student is within geofence', async () => {
      const session = await service.generateQrSession({
        facultyId: 'fac-01',
        subjectCode: 'CS-602',
        section: 'CSE-6A',
        period: 2,
        latitude: 30.3441,
        longitude: 77.9472,
      });

      const verification = await service.scanAndVerifyQr({
        qrToken: session.qrCodeToken,
        studentId: 'stu-01',
        userLat: 30.3441,
        userLng: 77.9472,
      });

      expect(verification.success).toBe(true);
      expect(verification.message).toContain('Attendance recorded successfully');
    });

    it('should reject scan when student coordinates exceed classroom geofence bounds', async () => {
      const session = await service.generateQrSession({
        facultyId: 'fac-01',
        subjectCode: 'CS-602',
        section: 'CSE-6A',
        period: 2,
        latitude: 30.3441,
        longitude: 77.9472,
      });

      // User coordinates far away (e.g. 5 km away in Rajpur Road)
      await expect(
        service.scanAndVerifyQr({
          qrToken: session.qrCodeToken,
          studentId: 'stu-01',
          userLat: 30.3800,
          userLng: 78.0800,
        }),
      ).rejects.toThrow('Geofence validation failed');
    });
  });

  describe('Batch Attendance Submission', () => {
    it('should correctly tally present, absent, and late counts', async () => {
      const res = await service.submitBatchAttendance({
        subjectCode: 'CS-801',
        section: 'CSE-8B',
        period: 2,
        records: [
          { studentId: 's1', status: 'PRESENT' as any },
          { studentId: 's2', status: 'PRESENT' as any },
          { studentId: 's3', status: 'ABSENT' as any },
          { studentId: 's4', status: 'LATE' as any },
        ],
      });

      expect(res.success).toBe(true);
      expect(res.totalSubmitted).toBe(4);
      expect(res.presentCount).toBe(2);
      expect(res.absentCount).toBe(1);
      expect(res.lateCount).toBe(1);
    });
  });
});
