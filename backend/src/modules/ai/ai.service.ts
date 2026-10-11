import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { ATTENDANCE_THRESHOLD, isBelowThreshold } from '../../common/utils/attendance-policy';
import { campusNow, slotStatus } from '../../common/utils/campus-clock';

export type CopilotIntent = 'ATTENDANCE' | 'FEES' | 'SCHEDULE' | 'EXAM' | 'TRANSPORT' | 'GENERAL';

export interface CopilotReply {
  intent: CopilotIntent;
  answer: string;
  data?: Record<string, unknown>;
}

const INTENT_KEYWORDS: [CopilotIntent, RegExp][] = [
  ['ATTENDANCE', /attendance|present|absent|75%|debar/],
  ['FEES', /fee|due|receipt|payment/],
  ['SCHEDULE', /class|timetable|schedule|lecture|\blab\b|next/],
  ['EXAM', /exam|admit|hall ticket/],
  ['TRANSPORT', /bus|transport|route/],
];

export function detectIntent(query: string): CopilotIntent {
  const text = query.toLowerCase();
  return INTENT_KEYWORDS.find(([, pattern]) => pattern.test(text))?.[0] ?? 'GENERAL';
}

const HELP_TEXT =
  'I can answer from your live records: attendance against the 75% rule, pending fees, today\'s classes, your next exam, and your bus pass.';
const STUDENT_ONLY = 'That question needs a student account — I answer it from your own academic records.';

/**
 * Rule-based campus assistant. Every answer is grounded in the caller's own
 * database records; when data doesn't exist, it says so instead of guessing.
 */
@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) {}

  async processCampusQuery(user: AuthUser, query: string): Promise<CopilotReply> {
    const intent = detectIntent(query);
    const studentId = user.role === UserRole.STUDENT ? user.studentId : undefined;

    switch (intent) {
      case 'ATTENDANCE':
        return studentId ? this.attendance(studentId) : { intent, answer: STUDENT_ONLY };
      case 'FEES':
        return studentId ? this.fees(studentId) : { intent, answer: STUDENT_ONLY };
      case 'SCHEDULE':
        return studentId ? this.schedule(studentId) : { intent, answer: STUDENT_ONLY };
      case 'EXAM':
        return studentId ? this.nextExam(studentId) : { intent, answer: STUDENT_ONLY };
      case 'TRANSPORT':
        return studentId ? this.transport(studentId) : { intent, answer: STUDENT_ONLY };
      default:
        return { intent: 'GENERAL', answer: HELP_TEXT };
    }
  }

  private async attendance(studentId: string): Promise<CopilotReply> {
    const s = await this.prisma.student.findUniqueOrThrow({ where: { id: studentId }, select: { overallAttendance: true } });
    const below = isBelowThreshold(s.overallAttendance);
    return {
      intent: 'ATTENDANCE',
      answer: below
        ? `Your overall attendance is ${s.overallAttendance}%, below the ${ATTENDANCE_THRESHOLD}% requirement of UTU Ordinance 14(B).`
        : `Your overall attendance is ${s.overallAttendance}%, above the ${ATTENDANCE_THRESHOLD}% requirement.`,
      data: { overallPercentage: s.overallAttendance, threshold: ATTENDANCE_THRESHOLD, belowThreshold: below },
    };
  }

  private async fees(studentId: string): Promise<CopilotReply> {
    const agg = await this.prisma.studentFee.aggregate({ where: { studentId }, _sum: { pendingAmount: true, totalAmount: true } });
    const pending = agg._sum.pendingAmount ?? 0;
    return {
      intent: 'FEES',
      answer:
        agg._sum.totalAmount == null
          ? 'No fee account has been set up for you yet.'
          : pending > 0
            ? `You have ₹${pending.toLocaleString('en-IN')} in pending dues.`
            : 'You have no pending dues.',
      data: { pendingDues: pending },
    };
  }

  private async schedule(studentId: string): Promise<CopilotReply> {
    const now = campusNow();
    const student = await this.prisma.student.findUniqueOrThrow({ where: { id: studentId }, select: { sectionId: true } });
    if (!now.dayCode || !student.sectionId) return { intent: 'SCHEDULE', answer: 'You have no classes scheduled today.' };

    const slots = await this.prisma.timetableEntry.findMany({
      where: { sectionId: student.sectionId, dayOfWeek: now.dayCode },
      include: { subject: true, room: true },
      orderBy: { period: 'asc' },
    });
    const remaining = slots.filter((t) => slotStatus(t.dayOfWeek, t.startTime, t.endTime, now) !== 'COMPLETED');
    if (remaining.length === 0) return { intent: 'SCHEDULE', answer: 'You have no more classes today.' };

    const list = remaining.map((t) => `${t.subject.name} (${t.subject.code}) at ${t.startTime} in ${t.room.roomNumber}`);
    return { intent: 'SCHEDULE', answer: `Remaining today: ${list.join('; ')}.`, data: { remainingCount: remaining.length } };
  }

  private async nextExam(studentId: string): Promise<CopilotReply> {
    const student = await this.prisma.student.findUniqueOrThrow({ where: { id: studentId }, select: { programId: true, semester: true } });
    const exam = await this.prisma.examSchedule.findFirst({
      where: { date: { gte: new Date() }, subject: { programId: student.programId, semester: student.semester } },
      include: { subject: true },
      orderBy: { date: 'asc' },
    });
    if (!exam) return { intent: 'EXAM', answer: 'No upcoming exams are scheduled for you yet.' };
    const date = exam.date.toISOString().slice(0, 10);
    return {
      intent: 'EXAM',
      answer: `Your next exam is ${exam.subject.name} (${exam.subject.code}) on ${date} at ${exam.startTime}.`,
      data: { subjectCode: exam.subject.code, date, startTime: exam.startTime },
    };
  }

  private async transport(studentId: string): Promise<CopilotReply> {
    const pass = await this.prisma.transportAssignment.findUnique({
      where: { studentId },
      include: { bus: { include: { route: true } } },
    });
    if (!pass) return { intent: 'TRANSPORT', answer: 'You do not have a transport pass.' };
    return {
      intent: 'TRANSPORT',
      answer: `Your bus is ${pass.bus.busNumber} on ${pass.bus.route.routeNumber} (${pass.bus.route.name}), departing ${pass.bus.route.departureTime}. Your stop: ${pass.pickupStop}.`,
      data: { routeNumber: pass.bus.route.routeNumber, busNumber: pass.bus.busNumber },
    };
  }
}
