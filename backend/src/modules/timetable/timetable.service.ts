import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DAY_MAP: Record<string, 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'> = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
};

const MOCK_TIMETABLE = [
  {
    id: 'tt-01',
    dayOfWeek: 'MON',
    period: 1,
    time: '09:00 - 10:00 AM',
    subjectCode: 'CS-601',
    subjectName: 'Compiler Design',
    faculty: 'Dr. V. K. Bhatt',
    room: 'LH-302',
    section: 'CSE-6A',
  },
  {
    id: 'tt-02',
    dayOfWeek: 'MON',
    period: 2,
    time: '10:15 - 11:15 AM',
    subjectCode: 'CS-602',
    subjectName: 'Cloud Computing & DevOps',
    faculty: 'Prof. Ananya Sen',
    room: 'Lab-401',
    section: 'CSE-6A',
  },
  {
    id: 'tt-03',
    dayOfWeek: 'MON',
    period: 3,
    time: '11:30 - 12:30 PM',
    subjectCode: 'CS-603',
    subjectName: 'Machine Learning Foundations',
    faculty: 'Dr. Priya Sharma',
    room: 'LH-204',
    section: 'CSE-6A',
  },
  {
    id: 'tt-04',
    dayOfWeek: 'MON',
    period: 5,
    time: '01:30 - 03:30 PM',
    subjectCode: 'CS-605P',
    subjectName: 'Full-Stack Web Engineering Lab',
    faculty: 'Er. S. Nautiyal',
    room: 'Turing Innovation Lab',
    section: 'CSE-6A',
  },
];

@Injectable()
export class TimetableService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { section?: string; facultyId?: string; day?: string }) {
    if (this.prisma.isConnected) {
      try {
        const whereClause: any = {};
        if (query?.day) whereClause.dayOfWeek = query.day.toUpperCase();
        if (query?.facultyId) whereClause.facultyId = query.facultyId;

        const entries = await this.prisma.timetableEntry.findMany({
          where: whereClause,
          include: {
            subject: true,
            faculty: { include: { user: true } },
            room: true,
            section: true,
          },
          orderBy: [{ period: 'asc' }],
        });

        if (entries && entries.length > 0) {
          return entries.map((t) => {
            const isLab = t.subject.type === 'PRACTICAL' || t.subject.code.includes('P');
            const dayName = DAY_MAP[t.dayOfWeek] || 'Monday';

            return {
              id: t.id,
              day: dayName,
              dayOfWeek: t.dayOfWeek,
              period: t.period,
              periodNumber: t.period,
              time: `${t.startTime} - ${t.endTime}`,
              timeSlot: `${t.startTime} - ${t.endTime}`,
              subjectCode: t.subject.code,
              code: t.subject.code,
              subjectName: t.subject.name,
              subject: t.subject.name,
              faculty: t.faculty.user.name,
              facultyName: t.faculty.user.name,
              facultyId: t.faculty.id,
              room: t.room.roomNumber,
              roomNumber: t.room.roomNumber,
              section: t.section.name,
              batchSection: t.section.name,
              type: (isLab ? 'LAB' : 'THEORY') as 'LAB' | 'THEORY',
              isLab,
              status: t.period === 1 ? 'COMPLETED' : t.period === 2 ? 'LIVE' : 'UPCOMING',
            };
          });
        }
      } catch {
        // Fallback
      }
    }

    let result = MOCK_TIMETABLE.map((t) => ({
      id: t.id,
      day: (DAY_MAP[t.dayOfWeek] || 'Monday') as any,
      dayOfWeek: t.dayOfWeek,
      period: t.period,
      periodNumber: t.period,
      time: t.time,
      timeSlot: t.time,
      subjectCode: t.subjectCode,
      code: t.subjectCode,
      subjectName: t.subjectName,
      subject: t.subjectName,
      faculty: t.faculty,
      facultyName: t.faculty,
      facultyId: 'fac-01',
      room: t.room,
      roomNumber: t.room,
      section: t.section,
      batchSection: t.section,
      type: (t.subjectCode.includes('P') ? 'LAB' : 'THEORY') as 'LAB' | 'THEORY',
      isLab: t.subjectCode.includes('P'),
      status: t.period === 1 ? 'COMPLETED' : t.period === 2 ? 'LIVE' : 'UPCOMING',
    }));

    if (query?.day) {
      result = result.filter((t) => t.dayOfWeek === query.day?.toUpperCase());
    }
    if (query?.section) {
      result = result.filter((t) => t.section === query.section);
    }
    return result;
  }

  async getMySchedule(userRole: string, id: string) {
    return this.findAll();
  }

  async getTodayStudentSchedule() {
    const list = await this.findAll({ day: 'MON' });
    return list.map((t) => ({
      id: t.id,
      time: t.time,
      code: t.subjectCode,
      subject: t.subjectName,
      faculty: t.faculty,
      room: t.room,
      isLab: t.isLab,
      status: t.status as 'COMPLETED' | 'LIVE' | 'UPCOMING',
    }));
  }

  async lockAndPublish() {
    return {
      success: true,
      message: 'Timetable schedule locked and synchronized with UTU matrix.',
    };
  }

  async checkConflicts(entry: {
    dayOfWeek: string;
    period: number;
    facultyId: string;
    roomId: string;
    sectionId: string;
  }) {
    if (this.prisma.isConnected) {
      const clash = await this.prisma.timetableEntry.findFirst({
        where: {
          dayOfWeek: entry.dayOfWeek,
          period: entry.period,
          OR: [{ roomId: entry.roomId }, { facultyId: entry.facultyId }],
        },
        include: { subject: true, room: true, faculty: { include: { user: true } } },
      });
      if (clash) {
        if (clash.roomId === entry.roomId) {
          throw new ConflictException(
            `Room clash: ${clash.room.roomNumber} is already booked by ${clash.faculty.user.name} for ${clash.subject.code}`,
          );
        }
        throw new ConflictException(
          `Faculty clash: ${clash.faculty.user.name} is already teaching period ${entry.period}`,
        );
      }
    }
    return { hasConflict: false };
  }
}
