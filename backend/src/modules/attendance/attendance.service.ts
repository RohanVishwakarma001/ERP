import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import { randomInt } from 'crypto';
import {
  AttendanceStatus,
  AttendanceVerificationMethod,
  AttendanceSessionStatus,
  PetitionStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { EventsGateway } from '../../infrastructure/websocket/events.gateway';
import {
  ATTENDANCE_THRESHOLD,
  CONDONATION_FLOOR,
  attendancePercent,
  classesNeededToReachThreshold,
  countsAsAttended,
  isBelowThreshold,
  subjectStanding,
} from '../../common/utils/attendance-policy';
import { haversineDistanceMeters } from '../../common/utils/geo';
import { BatchAttendanceDto, CreatePetitionDto, GenerateQrDto } from './dto/attendance.dto';

export interface SubjectAttendanceStat {
  code: string;
  name: string;
  faculty: string;
  attended: number;
  total: number;
  percentage: number;
  minRequired: number;
  neededFor75: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
}

const QR_TTL_SECONDS = 60;
const DEFAULT_GEOFENCE_RADIUS_M = 35;

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  /** Accepts a student id, user id, roll number or email (admin lookups) and returns the student id. */
  private async resolveStudentId(identifier: string): Promise<string> {
    const student = await this.prisma.student.findFirst({
      where: {
        OR: [{ id: identifier }, { userId: identifier }, { rollNumber: identifier }, { user: { email: identifier } }],
      },
      select: { id: true },
    });
    if (!student) throw new NotFoundException(`Student ${identifier} not found.`);
    return student.id;
  }

  /** Per-subject and overall attendance computed from real AttendanceRecord rows. */
  async getStudentSummary(identifier: string) {
    const studentId = await this.resolveStudentId(identifier);
    const records = await this.prisma.attendanceRecord.findMany({
      where: { studentId },
      include: { session: { include: { subject: true, faculty: { include: { user: true } } } } },
    });

    const bySubject = new Map<string, { code: string; name: string; faculty: string; attended: number; total: number }>();
    for (const rec of records) {
      const { subject, faculty } = rec.session;
      const entry = bySubject.get(subject.code) ?? {
        code: subject.code,
        name: subject.name,
        faculty: faculty.user.name,
        attended: 0,
        total: 0,
      };
      entry.total += 1;
      if (countsAsAttended(rec.status)) entry.attended += 1;
      bySubject.set(subject.code, entry);
    }

    const subjects: SubjectAttendanceStat[] = [...bySubject.values()].map((s) => {
      const percentage = attendancePercent(s.attended, s.total);
      return {
        ...s,
        percentage,
        minRequired: ATTENDANCE_THRESHOLD,
        neededFor75: classesNeededToReachThreshold(s.attended, s.total),
        status: percentage >= ATTENDANCE_THRESHOLD ? 'NORMAL' : percentage >= CONDONATION_FLOOR ? 'WARNING' : 'CRITICAL',
      };
    });

    const totalClasses = subjects.reduce((sum, s) => sum + s.total, 0);
    const totalAttended = subjects.reduce((sum, s) => sum + s.attended, 0);
    const overallPercentage = attendancePercent(totalAttended, totalClasses);

    return {
      studentId,
      overallPercentage,
      totalAttended,
      totalClasses,
      // No classes conducted yet is not a shortfall.
      isDebarred: totalClasses > 0 && isBelowThreshold(overallPercentage),
      statutoryThreshold: ATTENDANCE_THRESHOLD,
      subjects,
    };
  }

  /** Subject-wise attendance in the shape the web dashboard expects. */
  async getSubjectAttendanceList(studentId: string) {
    const summary = await this.getStudentSummary(studentId);
    return summary.subjects.map((s) => ({
      subjectCode: s.code,
      subjectName: s.name,
      facultyName: s.faculty,
      conducted: s.total,
      attended: s.attended,
      percentage: s.percentage,
      status: subjectStanding(s.percentage),
      requiredToReach75: s.neededFor75,
    }));
  }

  /** Pending attendance-correction petitions (duty leave / medical) for staff review. */
  async getAttendanceCorrections() {
    return this.findPetitions({ status: PetitionStatus.PENDING });
  }

  /** A student's own petitions in every state. */
  async getMyPetitions(studentId: string) {
    return this.findPetitions({ studentId });
  }

  async createPetition(studentId: string, dto: CreatePetitionDto) {
    const subject = await this.prisma.subject.findUnique({ where: { code: dto.subjectCode } });
    if (!subject) throw new BadRequestException(`Unknown subject code: ${dto.subjectCode}`);
    if (dto.date > new Date()) throw new BadRequestException('You cannot petition for a class that has not happened yet.');

    const petition = await this.prisma.attendancePetition.create({
      data: {
        studentId,
        subjectId: subject.id,
        date: dto.date,
        period: dto.period,
        reason: dto.reason.trim(),
        documentUrl: dto.documentUrl,
      },
    });
    const [view] = await this.findPetitions({ id: petition.id });
    return view;
  }

  private async findPetitions(where: Prisma.AttendancePetitionWhereInput) {
    const petitions = await this.prisma.attendancePetition.findMany({
      where,
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });

    // AttendancePetition stores subjectId without a relation; resolve names in one query.
    const subjects = await this.prisma.subject.findMany({
      where: { id: { in: [...new Set(petitions.map((p) => p.subjectId))] } },
      select: { id: true, code: true, name: true },
    });
    const subjectById = new Map(subjects.map((s) => [s.id, s]));

    return petitions.map((p) => ({
      id: p.id,
      studentId: p.studentId,
      studentName: p.student.user.name,
      rollNumber: p.student.rollNumber,
      subjectCode: subjectById.get(p.subjectId)?.code ?? null,
      subjectName: subjectById.get(p.subjectId)?.name ?? null,
      date: p.date.toISOString(),
      period: p.period,
      reason: p.reason,
      status: p.status,
      remarks: p.remarks,
      attachmentUrl: p.documentUrl,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  private async resolveSubjectAndSection(subjectCode: string, sectionName: string) {
    const [subject, section] = await Promise.all([
      this.prisma.subject.findUnique({ where: { code: subjectCode } }),
      this.prisma.section.findFirst({ where: { name: sectionName } }),
    ]);
    if (!subject) throw new BadRequestException(`Unknown subject code: ${subjectCode}`);
    if (!section) throw new BadRequestException(`Unknown section: ${sectionName}`);
    return { subject, section };
  }

  /** Recomputes the cached Student.overallAttendance / isDebarred fields from real records. */
  private async recalculateStudentAttendance(studentId: string) {
    const records = await this.prisma.attendanceRecord.findMany({ where: { studentId }, select: { status: true } });
    if (records.length === 0) return;

    const percentage = attendancePercent(records.filter((r) => countsAsAttended(r.status)).length, records.length);
    await this.prisma.student.update({
      where: { id: studentId },
      data: { overallAttendance: percentage, isDebarred: isBelowThreshold(percentage) },
    });
  }

  /**
   * Generates/rotates a 60s QR token with an optional classroom geofence, backed by
   * a real AttendanceSession. Re-generating within the same period rotates the token
   * on the existing OPEN session rather than fragmenting records across sessions.
   */
  async generateQrSession(facultyId: string, dto: GenerateQrDto) {
    const { subject, section } = await this.resolveSubjectAndSection(dto.subjectCode, dto.section);
    const token = `JBIT-QR-${dto.subjectCode}-${Date.now()}-${randomInt(1000, 10000)}`;
    const expiresAt = new Date(Date.now() + QR_TTL_SECONDS * 1000);
    const today = startOfToday();

    const existing = await this.prisma.attendanceSession.findFirst({
      where: {
        subjectId: subject.id,
        sectionId: section.id,
        period: dto.period,
        date: today,
        status: AttendanceSessionStatus.OPEN,
      },
    });

    const geofenceLat = dto.latitude ?? existing?.geofenceLat ?? undefined;
    const geofenceLng = dto.longitude ?? existing?.geofenceLng ?? undefined;

    const session = existing
      ? await this.prisma.attendanceSession.update({
          where: { id: existing.id },
          data: { qrToken: token, qrExpiresAt: expiresAt, geofenceLat, geofenceLng },
        })
      : await this.prisma.attendanceSession.create({
          data: {
            subjectId: subject.id,
            sectionId: section.id,
            facultyId,
            date: today,
            period: dto.period,
            status: AttendanceSessionStatus.OPEN,
            qrToken: token,
            qrExpiresAt: expiresAt,
            geofenceLat,
            geofenceLng,
            geofenceRadius: DEFAULT_GEOFENCE_RADIUS_M,
          },
        });

    return {
      qrCodeToken: session.qrToken,
      expiresInSeconds: QR_TTL_SECONDS,
      expiresAt: session.qrExpiresAt,
      subjectCode: dto.subjectCode,
      section: dto.section,
      period: dto.period,
      geofenceValidated: geofenceLat != null && geofenceLng != null,
      sessionId: session.id,
    };
  }

  /**
   * Student scans a classroom QR token. Validated against the live session, the
   * geofence is enforced when configured, and the sessionId+studentId unique
   * constraint prevents duplicate scans.
   */
  async scanAndVerifyQr(data: { qrToken: string; studentId: string; userLat?: number; userLng?: number }) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { qrToken: data.qrToken },
      include: { subject: true, section: true },
    });

    if (!session) {
      throw new BadRequestException('Invalid QR code. Please scan the code currently displayed by your faculty.');
    }
    if (session.status !== AttendanceSessionStatus.OPEN) {
      throw new BadRequestException('This attendance session has already been closed.');
    }
    if (!session.qrExpiresAt || new Date() > session.qrExpiresAt) {
      throw new BadRequestException('QR code has expired. Please scan the current code — it rotates every 60 seconds.');
    }

    // A valid token only authorises students enrolled in that session's section —
    // otherwise a forwarded code would let anyone mark themselves present anywhere.
    const enrolled = await this.prisma.student.findUnique({ where: { id: data.studentId }, select: { sectionId: true } });
    if (!enrolled || enrolled.sectionId !== session.sectionId) {
      throw new ForbiddenException('This QR code belongs to a class you are not enrolled in.');
    }

    if (session.geofenceLat != null && session.geofenceLng != null) {
      if (data.userLat == null || data.userLng == null) {
        throw new BadRequestException('Location access is required to mark attendance for this class.');
      }
      const distance = haversineDistanceMeters(session.geofenceLat, session.geofenceLng, data.userLat, data.userLng);
      const radius = session.geofenceRadius ?? DEFAULT_GEOFENCE_RADIUS_M;
      if (distance > radius) {
        throw new BadRequestException(
          `Geofence validation failed. You are ${Math.round(distance)}m from the classroom (max permitted: ${radius}m).`,
        );
      }
    }

    const student = await this.prisma.student.findUnique({ where: { id: data.studentId }, include: { user: true } });
    if (!student) throw new NotFoundException('Student profile not found for this account.');

    try {
      await this.prisma.attendanceRecord.create({
        data: {
          sessionId: session.id,
          studentId: data.studentId,
          status: AttendanceStatus.PRESENT,
          verifiedVia: AttendanceVerificationMethod.QR,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Attendance for this class has already been recorded.');
      }
      throw err;
    }

    await this.recalculateStudentAttendance(data.studentId);

    // Live tally for the faculty's broadcaster screen — best effort, never fails the scan.
    try {
      const scannedCount = await this.prisma.attendanceRecord.count({ where: { sessionId: session.id } });
      this.eventsGateway.server.to(`class_${session.section.name}`).emit('qr_scan_received', {
        sessionId: session.id,
        studentName: student.user.name,
        rollNumber: student.rollNumber,
        scannedCount,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      this.logger.warn(`Failed to broadcast live scan tally: ${(err as Error).message}`);
    }

    return {
      success: true,
      message: 'Attendance recorded successfully via geofenced QR code.',
      subject: session.subject.code,
      timestamp: new Date().toISOString(),
      method: AttendanceVerificationMethod.QR,
    };
  }

  /**
   * Faculty submits roster attendance for a period. Records are upserted (so a
   * re-submission corrects rather than duplicates) and the session is closed.
   */
  async submitBatchAttendance(facultyId: string, dto: BatchAttendanceDto) {
    const { subject, section } = await this.resolveSubjectAndSection(dto.subjectCode, dto.section);
    const today = startOfToday();

    const existingSession = await this.prisma.attendanceSession.findFirst({
      where: { subjectId: subject.id, sectionId: section.id, period: dto.period, date: today },
    });

    const session = existingSession
      ? await this.prisma.attendanceSession.update({
          where: { id: existingSession.id },
          data: { status: AttendanceSessionStatus.CLOSED },
        })
      : await this.prisma.attendanceSession.create({
          data: {
            subjectId: subject.id,
            sectionId: section.id,
            facultyId,
            date: today,
            period: dto.period,
            status: AttendanceSessionStatus.CLOSED,
          },
        });

    await this.prisma.$transaction(
      dto.records.map((r) =>
        this.prisma.attendanceRecord.upsert({
          where: { sessionId_studentId: { sessionId: session.id, studentId: r.studentId } },
          update: { status: r.status, verifiedVia: AttendanceVerificationMethod.MANUAL },
          create: {
            sessionId: session.id,
            studentId: r.studentId,
            status: r.status,
            verifiedVia: AttendanceVerificationMethod.MANUAL,
          },
        }),
      ),
    );

    await Promise.all(dto.records.map((r) => this.recalculateStudentAttendance(r.studentId)));

    const count = (status: AttendanceStatus) => dto.records.filter((r) => r.status === status).length;
    return {
      success: true,
      message: `Attendance saved for ${dto.subjectCode} (${dto.section}, period ${dto.period}).`,
      sessionId: session.id,
      totalSubmitted: dto.records.length,
      presentCount: count(AttendanceStatus.PRESENT),
      absentCount: count(AttendanceStatus.ABSENT),
      lateCount: count(AttendanceStatus.LATE),
      timestamp: new Date().toISOString(),
    };
  }
}
