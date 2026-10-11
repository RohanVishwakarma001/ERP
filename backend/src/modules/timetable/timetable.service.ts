import { Injectable, ConflictException } from '@nestjs/common';
import { Prisma, SubjectType, UserRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { DAY_NAMES, DayCode, campusNow, slotStatus } from '../../common/utils/campus-clock';
import { CheckConflictDto, TimetableQueryDto } from './dto/timetable.dto';

const ENTRY_INCLUDE = {
  subject: true,
  faculty: { include: { user: { select: { name: true } } } },
  room: true,
  section: true,
} satisfies Prisma.TimetableEntryInclude;

type EntryRow = Prisma.TimetableEntryGetPayload<{ include: typeof ENTRY_INCLUDE }>;

const DAY_ORDER: Record<string, number> = { MON: 0, TUE: 1, WED: 2, THU: 3, FRI: 4, SAT: 5 };

@Injectable()
export class TimetableService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: TimetableQueryDto = {}) {
    const where: Prisma.TimetableEntryWhereInput = {};
    if (query.day) where.dayOfWeek = query.day;
    if (query.facultyId) where.facultyId = query.facultyId;
    if (query.section) where.section = { name: query.section };

    const entries = await this.prisma.timetableEntry.findMany({ where, include: ENTRY_INCLUDE });
    const now = campusNow();
    return entries
      .sort((a, b) => (DAY_ORDER[a.dayOfWeek] ?? 9) - (DAY_ORDER[b.dayOfWeek] ?? 9) || a.period - b.period)
      .map((t) => this.toView(t, now));
  }

  /** Students see their section's timetable; faculty see their own teaching slots; staff see everything. */
  async getMySchedule(user: AuthUser, day?: DayCode) {
    return this.findAll({ day, ...(await this.scopeFor(user)) });
  }

  /** Today's slots for the caller (empty on Sundays), in the compact shape the mobile app uses. */
  async getToday(user: AuthUser) {
    const { dayCode } = campusNow();
    if (!dayCode) return [];
    const slots = await this.getMySchedule(user, dayCode);
    return slots.map((t) => ({
      id: t.id,
      time: t.time,
      code: t.subjectCode,
      subject: t.subjectName,
      faculty: t.facultyName,
      room: t.roomNumber,
      section: t.section,
      period: t.period,
      isLab: t.isLab,
      status: t.status,
    }));
  }

  async checkConflicts(dto: CheckConflictDto) {
    const clash = await this.prisma.timetableEntry.findFirst({
      where: {
        dayOfWeek: dto.dayOfWeek,
        period: dto.period,
        OR: [{ roomId: dto.roomId }, { facultyId: dto.facultyId }, { sectionId: dto.sectionId }],
      },
      include: ENTRY_INCLUDE,
    });
    if (!clash) return { hasConflict: false };

    if (clash.roomId === dto.roomId) {
      throw new ConflictException(
        `Room clash: ${clash.room.roomNumber} is already booked by ${clash.faculty.user.name} for ${clash.subject.code}.`,
      );
    }
    if (clash.facultyId === dto.facultyId) {
      throw new ConflictException(`Faculty clash: ${clash.faculty.user.name} is already teaching period ${dto.period}.`);
    }
    throw new ConflictException(`Section clash: ${clash.section.name} already has ${clash.subject.code} in period ${dto.period}.`);
  }

  private async scopeFor(user: AuthUser): Promise<Pick<TimetableQueryDto, 'section' | 'facultyId'>> {
    if (user.role === UserRole.STUDENT && user.studentId) {
      const student = await this.prisma.student.findUnique({
        where: { id: user.studentId },
        select: { section: { select: { name: true } } },
      });
      // A student without a section has no timetable rather than everyone's.
      return { section: student?.section?.name ?? '__none__' };
    }
    if (user.facultyId) return { facultyId: user.facultyId };
    return {};
  }

  /**
   * Field names are duplicated (e.g. `subjectName` / `subject`) because the web and
   * mobile clients grew different vocabularies. Prefer the first name in each pair
   * for new code; the aliases are kept for compatibility.
   */
  private toView(t: EntryRow, now: ReturnType<typeof campusNow>) {
    const isLab = t.subject.type === SubjectType.PRACTICAL;
    const time = `${t.startTime} - ${t.endTime}`;
    return {
      id: t.id,
      dayOfWeek: t.dayOfWeek,
      day: DAY_NAMES[t.dayOfWeek as DayCode] ?? t.dayOfWeek,
      period: t.period,
      periodNumber: t.period,
      startTime: t.startTime,
      endTime: t.endTime,
      time,
      timeSlot: time,
      subjectCode: t.subject.code,
      code: t.subject.code,
      subjectName: t.subject.name,
      subject: t.subject.name,
      facultyId: t.faculty.id,
      facultyName: t.faculty.user.name,
      faculty: t.faculty.user.name,
      roomNumber: t.room.roomNumber,
      room: t.room.roomNumber,
      section: t.section.name,
      batchSection: t.section.name,
      type: isLab ? ('LAB' as const) : ('THEORY' as const),
      isLab,
      status: slotStatus(t.dayOfWeek, t.startTime, t.endTime, now),
    };
  }
}
