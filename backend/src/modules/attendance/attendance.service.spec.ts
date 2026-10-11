import { BadRequestException, ConflictException, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AttendanceService (Critical Business Logic Tests)', () => {
  let service: AttendanceService;
  let mockPrisma: any;

  const subject = { id: 'subj-1', code: 'CS-602', name: 'Cloud Computing & DevOps' };
  const section = { id: 'sec-1', name: 'CSE-6A' };
  const student = { id: 'stu-01', rollNumber: '220102048', user: { name: 'Aarav Sharma' } };
  let mockEventsGateway: any;

  beforeEach(() => {
    mockPrisma = {
      isConnected: true,
      subject: { findUnique: jest.fn().mockResolvedValue(subject) },
      section: { findFirst: jest.fn().mockResolvedValue(section) },
      student: {
        findFirst: jest.fn().mockResolvedValue(student),
        findUnique: jest.fn().mockResolvedValue(student),
        update: jest.fn().mockResolvedValue({}),
      },
      attendanceSession: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      attendanceRecord: {
        create: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([{ status: 'PRESENT' }]),
        upsert: jest.fn().mockResolvedValue({}),
        count: jest.fn().mockResolvedValue(1),
      },
      $transaction: jest.fn((ops: any[]) => Promise.all(ops)),
    };
    mockEventsGateway = { server: { to: jest.fn().mockReturnValue({ emit: jest.fn() }) } };
    service = new AttendanceService(mockPrisma as unknown as PrismaService, mockEventsGateway);
  });

  describe('Statutory 75% Attendance & Debarment Calculations', () => {
    it('should calculate attendance percentage accurately', async () => {
      const summary = await service.getStudentSummary('stu-01');
      expect(summary).toBeDefined();
      expect(summary.statutoryThreshold).toBe(75);
      expect(summary.overallPercentage).toBeGreaterThanOrEqual(0);
      expect(summary.overallPercentage).toBeLessThanOrEqual(100);
    });
  });

  describe('Secure QR Attendance Verification', () => {
    it('creates a real AttendanceSession row and returns a 60-second rotating token', async () => {
      mockPrisma.attendanceSession.create.mockResolvedValue({
        id: 'sess-1',
        qrToken: 'JBIT-QR-CS-602-123-4567',
        qrExpiresAt: new Date(Date.now() + 60_000),
        geofenceLat: 30.3441,
        geofenceLng: 77.9472,
      });

      const session = await service.generateQrSession({
        facultyId: 'fac-01',
        subjectCode: 'CS-602',
        section: 'CSE-6A',
        period: 2,
        latitude: 30.3441,
        longitude: 77.9472,
      });

      expect(session.qrCodeToken).toContain('JBIT-QR-CS-602');
      expect(session.expiresInSeconds).toBe(60);
      expect(session.geofenceValidated).toBe(true);
      expect(mockPrisma.attendanceSession.create).toHaveBeenCalled();
    });

    it('rejects a QR token with no matching live session (no more fallback bypass)', async () => {
      mockPrisma.attendanceSession.findUnique.mockResolvedValue(null);

      await expect(
        service.scanAndVerifyQr({ qrToken: 'JBIT-QR-forged-token', studentId: 'stu-01' }),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.attendanceRecord.create).not.toHaveBeenCalled();
    });

    it('rejects an expired QR token even if it matches a real session', async () => {
      mockPrisma.attendanceSession.findUnique.mockResolvedValue({
        id: 'sess-1',
        status: 'OPEN',
        qrExpiresAt: new Date(Date.now() - 5000),
        geofenceLat: null,
        geofenceLng: null,
        subject,
        section,
      });

      await expect(
        service.scanAndVerifyQr({ qrToken: 'JBIT-QR-CS-602-old', studentId: 'stu-01' }),
      ).rejects.toThrow('QR code has expired');
    });

    it('accepts a scan when the token is live and the student is within geofence, and persists a record', async () => {
      mockPrisma.attendanceSession.findUnique.mockResolvedValue({
        id: 'sess-1',
        status: 'OPEN',
        qrExpiresAt: new Date(Date.now() + 30_000),
        geofenceLat: 30.3441,
        geofenceLng: 77.9472,
        geofenceRadius: 35,
        subject,
        section,
      });

      const verification = await service.scanAndVerifyQr({
        qrToken: 'JBIT-QR-CS-602-live',
        studentId: 'stu-01',
        userLat: 30.3441,
        userLng: 77.9472,
      });

      expect(verification.success).toBe(true);
      expect(mockPrisma.attendanceRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ sessionId: 'sess-1', studentId: 'stu-01' }) }),
      );
      expect(mockPrisma.student.update).toHaveBeenCalled();
    });

    it('rejects a scan when the student is outside the classroom geofence', async () => {
      mockPrisma.attendanceSession.findUnique.mockResolvedValue({
        id: 'sess-1',
        status: 'OPEN',
        qrExpiresAt: new Date(Date.now() + 30_000),
        geofenceLat: 30.3441,
        geofenceLng: 77.9472,
        geofenceRadius: 35,
        subject,
        section,
      });

      await expect(
        service.scanAndVerifyQr({
          qrToken: 'JBIT-QR-CS-602-live',
          studentId: 'stu-01',
          userLat: 30.38,
          userLng: 78.08,
        }),
      ).rejects.toThrow('Geofence validation failed');
    });

    it('rejects a duplicate scan of the same session as a conflict, not a silent success', async () => {
      mockPrisma.attendanceSession.findUnique.mockResolvedValue({
        id: 'sess-1',
        status: 'OPEN',
        qrExpiresAt: new Date(Date.now() + 30_000),
        geofenceLat: null,
        geofenceLng: null,
        subject,
        section,
      });
      mockPrisma.attendanceRecord.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '6.0.0',
        }),
      );

      await expect(
        service.scanAndVerifyQr({ qrToken: 'JBIT-QR-CS-602-live', studentId: 'stu-01' }),
      ).rejects.toThrow(ConflictException);
    });

    it('refuses to fabricate success when the database is unreachable', async () => {
      mockPrisma.isConnected = false;
      await expect(
        service.scanAndVerifyQr({ qrToken: 'JBIT-QR-anything', studentId: 'stu-01' }),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('Batch Attendance Submission', () => {
    it('persists real AttendanceRecord rows and correctly tallies present/absent/late counts', async () => {
      mockPrisma.attendanceSession.create.mockResolvedValue({ id: 'sess-2' });

      const res = await service.submitBatchAttendance({
        facultyId: 'fac-01',
        subjectCode: 'CS-602',
        section: 'CSE-6A',
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
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.attendanceRecord.upsert).toHaveBeenCalledTimes(4);
    });
  });
});
