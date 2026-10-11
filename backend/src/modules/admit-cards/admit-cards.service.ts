import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AdmitCardStatus, Prisma, UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import { AppConfig } from '../../config';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { renderAdmitCardPdf } from './admit-card-pdf';
import { createDownloadToken, DOWNLOAD_TOKEN_TTL_SECONDS, verifyDownloadToken } from './download-token';
import { ApproveAdmitCardsDto, RevokeAdmitCardDto } from './dto/admit-cards.dto';

const isoDate = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : null);
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Why a student can't be approved without an override. */
type Blocker = 'FEES_OUTSTANDING' | 'DEBARRED';

const STUDENT_SELECT = {
  id: true,
  rollNumber: true,
  semester: true,
  isDebarred: true,
  overallAttendance: true,
  programId: true,
  user: { select: { name: true, email: true, status: true } },
  program: { select: { code: true } },
  section: { select: { name: true } },
  fees: { select: { totalAmount: true, pendingAmount: true, dueDate: true } },
} satisfies Prisma.StudentSelect;

type StudentRow = Prisma.StudentGetPayload<{ select: typeof STUDENT_SELECT }>;

/**
 * Admit cards: an administrator approves each student for an exam after checking
 * that their fees are cleared and that they aren't debarred for attendance. A
 * student can download the card only once it is approved.
 */
@Injectable()
export class AdmitCardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfig,
  ) {}

  // ── Administrators ─────────────────────────────────────────────────────────

  /** Every candidate for the exam (program + semester has a paper in it) with fee and approval state. */
  async listForExam(examId: string) {
    const exam = await this.requireExam(examId);
    const candidates = await this.candidatesFor(exam.schedules.map((s) => s.subject));
    const cards = await this.prisma.admitCard.findMany({ where: { examId } });
    const cardByStudent = new Map(cards.map((c) => [c.studentId, c]));

    return {
      exam: { id: exam.id, title: exam.title, cycle: exam.cycle, academicYear: exam.academicYear, status: exam.status, papers: exam.schedules.length },
      candidates: candidates.map((s) => {
        const card = cardByStudent.get(s.id);
        const fees = this.feeSummary(s);
        return {
          studentId: s.id,
          name: s.user.name,
          email: s.user.email,
          rollNumber: s.rollNumber,
          program: s.program.code,
          semester: s.semester,
          section: s.section?.name ?? null,
          attendance: s.overallAttendance,
          isDebarred: s.isDebarred,
          fees,
          blockers: this.blockersFor(s),
          admitCard: card
            ? {
                id: card.id,
                status: card.status,
                cardNumber: card.cardNumber,
                approvedAt: card.approvedAt.toISOString(),
                revokedAt: card.revokedAt?.toISOString() ?? null,
                overridden: card.overridden,
                remarks: card.remarks,
              }
            : null,
        };
      }),
    };
  }

  /**
   * Approves the selected students. Anyone with outstanding fees or a debarment is
   * skipped unless an override reason is given — that reason is stored on the card.
   */
  async approve(dto: ApproveAdmitCardsDto, actor: AuthUser) {
    const exam = await this.requireExam(dto.examId);
    const candidates = await this.candidatesFor(exam.schedules.map((s) => s.subject));
    const byId = new Map(candidates.map((s) => [s.id, s]));

    const approved: string[] = [];
    const skipped: { studentId: string; name: string | null; reason: string }[] = [];

    for (const studentId of dto.studentIds) {
      const student = byId.get(studentId);
      if (!student) {
        skipped.push({ studentId, name: null, reason: 'Not a candidate for this exam (no paper for their program and semester).' });
        continue;
      }
      const blockers = this.blockersFor(student);
      if (blockers.length > 0 && !dto.overrideReason) {
        skipped.push({ studentId, name: student.user.name, reason: this.describe(blockers, student) });
        continue;
      }
      const overridden = blockers.length > 0;
      const remarks = overridden ? `${dto.overrideReason} (${this.describe(blockers, student)})` : null;
      await this.prisma.admitCard.upsert({
        where: { examId_studentId: { examId: exam.id, studentId } },
        create: {
          examId: exam.id,
          studentId,
          cardNumber: this.newCardNumber(exam.cycle),
          status: AdmitCardStatus.APPROVED,
          overridden,
          remarks,
          approvedById: actor.id,
        },
        update: { status: AdmitCardStatus.APPROVED, overridden, remarks, approvedById: actor.id, approvedAt: new Date(), revokedAt: null },
      });
      approved.push(studentId);
    }

    if (approved.length > 0) {
      await this.prisma.auditLog.create({
        data: {
          userId: actor.id,
          action: dto.overrideReason ? 'APPROVE_ADMIT_CARDS_OVERRIDE' : 'APPROVE_ADMIT_CARDS',
          entity: 'Exam',
          entityId: exam.id,
          afterValue: JSON.stringify({ approved: approved.length, overrideReason: dto.overrideReason ?? null }),
        },
      });
    }
    return { approved: approved.length, skipped };
  }

  async revoke(id: string, dto: RevokeAdmitCardDto, actor: AuthUser) {
    const card = await this.prisma.admitCard.findUnique({ where: { id } });
    if (!card) throw new NotFoundException('Admit card not found.');
    if (card.status === AdmitCardStatus.REVOKED) throw new BadRequestException('This admit card is already revoked.');
    await this.prisma.$transaction([
      this.prisma.admitCard.update({
        where: { id },
        data: { status: AdmitCardStatus.REVOKED, revokedAt: new Date(), remarks: `Revoked: ${dto.reason}` },
      }),
      this.prisma.auditLog.create({
        data: { userId: actor.id, action: 'REVOKE_ADMIT_CARD', entity: 'AdmitCard', entityId: id, afterValue: JSON.stringify({ reason: dto.reason }) },
      }),
    ]);
    return { id, status: AdmitCardStatus.REVOKED };
  }

  // ── Students ───────────────────────────────────────────────────────────────

  /** Exams with papers for the student's program and semester, their timetable and admit card state. */
  async listMine(studentId: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId }, select: STUDENT_SELECT });
    if (!student) throw new NotFoundException('Student profile not found.');

    const exams = await this.prisma.exam.findMany({
      where: { schedules: { some: { subject: { programId: student.programId, semester: student.semester } } } },
      include: {
        schedules: {
          where: { subject: { programId: student.programId, semester: student.semester } },
          include: { subject: { select: { code: true, name: true } } },
          orderBy: { date: 'asc' },
        },
        admitCards: { where: { studentId } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      fees: this.feeSummary(student),
      isDebarred: student.isDebarred,
      exams: exams.map((e) => {
        const card = e.admitCards[0];
        return {
          examId: e.id,
          title: e.title,
          cycle: e.cycle,
          academicYear: e.academicYear,
          status: e.status,
          papers: e.schedules.map((p) => ({
            id: p.id,
            code: p.subject.code,
            name: p.subject.name,
            date: isoDate(p.date),
            startTime: p.startTime,
            endTime: p.endTime,
          })),
          admitCard: card
            ? { id: card.id, status: card.status, cardNumber: card.cardNumber, approvedAt: card.approvedAt.toISOString(), remarks: card.status === 'REVOKED' ? card.remarks : null }
            : null,
        };
      }),
    };
  }

  /** A short-lived link that downloads the PDF without a bearer token (for the mobile app's browser). */
  async createDownloadLink(id: string, user: AuthUser) {
    await this.loadApprovedCard(id, user);
    const token = createDownloadToken(id, user.id, this.config.jwtAccessSecret);
    return { path: `/admit-cards/download?token=${encodeURIComponent(token)}`, expiresInSeconds: DOWNLOAD_TOKEN_TTL_SECONDS };
  }

  async renderPdf(id: string, user: AuthUser) {
    return this.render(await this.loadApprovedCard(id, user));
  }

  async renderPdfFromToken(token: string) {
    const claims = typeof token === 'string' ? verifyDownloadToken(token, this.config.jwtAccessSecret) : null;
    if (!claims) throw new ForbiddenException('This download link is invalid or has expired. Open it again from the app.');
    // Re-checked at download time: a card revoked after the link was issued must not download.
    return this.render(await this.loadApprovedCard(claims.aid, null));
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Students may read only their own approved card; administrators may read any approved card. */
  private async loadApprovedCard(id: string, user: AuthUser | null) {
    const card = await this.prisma.admitCard.findUnique({
      where: { id },
      include: {
        exam: true,
        student: {
          include: {
            user: { select: { name: true } },
            program: { select: { name: true, id: true } },
            department: { select: { name: true } },
            section: { select: { name: true } },
          },
        },
      },
    });
    if (!card) throw new NotFoundException('Admit card not found.');
    if (user && user.role === UserRole.STUDENT && card.studentId !== user.studentId) {
      throw new ForbiddenException('You can only download your own admit card.');
    }
    if (user && user.role !== UserRole.STUDENT && user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only the student and administrators can download admit cards.');
    }
    if (card.status !== AdmitCardStatus.APPROVED) {
      throw new ForbiddenException('This admit card has been revoked. Contact the examination cell.');
    }
    return card;
  }

  private async render(card: Awaited<ReturnType<AdmitCardsService['loadApprovedCard']>>) {
    const s = card.student;
    const papers = await this.prisma.examSchedule.findMany({
      where: { examId: card.examId, subject: { programId: s.programId, semester: s.semester } },
      include: {
        subject: { select: { code: true, name: true } },
        examRooms: { include: { room: { select: { roomNumber: true } }, seatings: { where: { studentId: s.id } } } },
      },
      orderBy: { date: 'asc' },
    });
    const pdf = await renderAdmitCardPdf({
      cardNumber: card.cardNumber,
      approvedAt: card.approvedAt,
      exam: { title: card.exam.title, cycle: card.exam.cycle, academicYear: card.exam.academicYear },
      student: {
        name: s.user.name,
        rollNumber: s.rollNumber,
        enrollmentNumber: s.enrollmentNumber,
        program: s.program.name,
        department: s.department.name,
        semester: s.semester,
        section: s.section?.name ?? null,
      },
      papers: papers.map((p) => {
        const seated = p.examRooms.find((r) => r.seatings.length > 0);
        return {
          date: p.date,
          startTime: p.startTime,
          endTime: p.endTime,
          code: p.subject.code,
          name: p.subject.name,
          seat: seated ? `${seated.room.roomNumber} / ${seated.seatings[0].seatNumber}` : null,
        };
      }),
    });
    return { pdf, fileName: `admit-card-${s.rollNumber}-${card.exam.cycle}.pdf`.replace(/[^\w.-]+/g, '_') };
  }

  private async requireExam(id: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: { schedules: { include: { subject: { select: { programId: true, semester: true } } } } },
    });
    if (!exam) throw new NotFoundException('Exam not found.');
    return exam;
  }

  /** Active students whose program + current semester has at least one paper in the exam. */
  private async candidatesFor(subjects: { programId: string; semester: number }[]): Promise<StudentRow[]> {
    const pairs = [...new Map(subjects.map((s) => [`${s.programId}:${s.semester}`, s])).values()];
    if (pairs.length === 0) return [];
    return this.prisma.student.findMany({
      where: {
        deletedAt: null,
        user: { deletedAt: null, status: 'ACTIVE' },
        OR: pairs.map((p) => ({ programId: p.programId, semester: p.semester })),
      },
      select: STUDENT_SELECT,
      orderBy: [{ program: { code: 'asc' } }, { rollNumber: 'asc' }],
    });
  }

  private feeSummary(s: Pick<StudentRow, 'fees'>) {
    const pending = round2(s.fees.reduce((n, f) => n + f.pendingAmount, 0));
    const now = new Date();
    return {
      billed: s.fees.length > 0,
      totalBilled: round2(s.fees.reduce((n, f) => n + f.totalAmount, 0)),
      pending,
      overdue: s.fees.some((f) => f.pendingAmount > 0 && f.dueDate < now),
      cleared: pending <= 0,
    };
  }

  private blockersFor(s: StudentRow): Blocker[] {
    const blockers: Blocker[] = [];
    if (!this.feeSummary(s).cleared) blockers.push('FEES_OUTSTANDING');
    if (s.isDebarred) blockers.push('DEBARRED');
    return blockers;
  }

  private describe(blockers: Blocker[], s: StudentRow) {
    return blockers
      .map((b) =>
        b === 'FEES_OUTSTANDING'
          ? `₹${this.feeSummary(s).pending.toLocaleString('en-IN')} fees outstanding`
          : `debarred (attendance ${s.overallAttendance}%)`,
      )
      .join('; ');
  }

  private newCardNumber(cycle: string) {
    return `AC-${cycle}-${randomBytes(4).toString('hex').toUpperCase()}`;
  }
}
