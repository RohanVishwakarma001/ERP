import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AssessmentType, ResultStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { PASSING_GRADE_POINT, computeSgpa, gradeFor } from '../../common/utils/grading';
import { GenerateSeatingDto, RecordMarksDto } from './dto/examinations.dto';
import { interleaveByGroup, seatPositions } from './seating';

const DEFAULT_DESKS_PER_ROW = 6;
const PUBLISHED_RESULT_STATUSES: ResultStatus[] = [ResultStatus.PUBLISHED, ResultStatus.LOCKED];

const formatDate = (d: Date) => d.toISOString().slice(0, 10);

@Injectable()
export class ExaminationsService {
  constructor(private prisma: PrismaService) {}

  async getSchedule() {
    const schedules = await this.prisma.examSchedule.findMany({
      include: { subject: true, exam: true, examRooms: { include: { room: true } } },
      orderBy: { date: 'asc' },
    });
    return schedules.map((s) => ({
      id: s.id,
      examTitle: s.exam.title,
      code: s.subject.code,
      subject: s.subject.name,
      date: formatDate(s.date),
      time: `${s.startTime} - ${s.endTime}`,
      type: s.subject.type,
      maxMarks: s.maxMarks,
      rooms: s.examRooms.map((r) => r.room.roomNumber),
    }));
  }

  /** Exam cycles with date range and real hall / candidate counts. */
  async getCycles() {
    const exams = await this.prisma.exam.findMany({
      include: { schedules: { include: { examRooms: { include: { _count: { select: { seatings: true } } } } } } },
      orderBy: { createdAt: 'desc' },
    });

    return exams.map((e) => {
      const dates = e.schedules.map((s) => s.date.getTime());
      const rooms = e.schedules.flatMap((s) => s.examRooms);
      return {
        id: e.id,
        name: e.title,
        session: e.cycle,
        academicYear: e.academicYear,
        status: e.status,
        startDate: dates.length ? formatDate(new Date(Math.min(...dates))) : null,
        endDate: dates.length ? formatDate(new Date(Math.max(...dates))) : null,
        totalPapers: e.schedules.length,
        totalHalls: new Set(rooms.map((r) => r.roomId)).size,
        totalSeatings: rooms.reduce((sum, r) => sum + r._count.seatings, 0),
      };
    });
  }

  /** One row per (paper, room) allocation with its candidate count and invigilators. */
  async getSeatingHalls() {
    const examRooms = await this.prisma.examRoom.findMany({
      include: {
        room: { include: { building: true } },
        schedule: { include: { subject: { include: { department: true } } } },
        invigilators: { include: { faculty: { include: { user: { select: { name: true } } } } } },
        _count: { select: { seatings: true } },
      },
      orderBy: { schedule: { date: 'asc' } },
    });

    return examRooms.map((er) => ({
      id: er.id,
      hallNumber: er.room.roomNumber,
      block: er.room.building.name,
      capacity: er.room.capacity,
      date: formatDate(er.schedule.date),
      shift: `${er.schedule.startTime} - ${er.schedule.endTime}`,
      subjectCode: er.schedule.subject.code,
      assignedDepartments: [er.schedule.subject.department.name],
      candidateCount: er._count.seatings,
      invigilators: er.invigilators.map((i) => i.faculty.user.name),
    }));
  }

  /**
   * Seats every eligible, not-yet-seated candidate for a paper into a room, up to
   * the room's capacity, interleaving departments so neighbours differ.
   * Eligible = same program and semester as the paper, and not debarred.
   */
  async generateSeatingMatrix(dto: GenerateSeatingDto) {
    const [schedule, room] = await Promise.all([
      this.prisma.examSchedule.findUnique({ where: { id: dto.scheduleId }, include: { subject: true } }),
      this.prisma.room.findUnique({ where: { id: dto.roomId } }),
    ]);
    if (!schedule) throw new NotFoundException(`Exam schedule ${dto.scheduleId} not found.`);
    if (!room) throw new NotFoundException(`Room ${dto.roomId} not found.`);

    const examRoom =
      (await this.prisma.examRoom.findFirst({
        where: { scheduleId: schedule.id, roomId: room.id },
        include: { _count: { select: { seatings: true } } },
      })) ??
      (await this.prisma.examRoom.create({
        data: { scheduleId: schedule.id, roomId: room.id },
        include: { _count: { select: { seatings: true } } },
      }));

    const freeSeats = room.capacity - examRoom._count.seatings;
    if (freeSeats <= 0) throw new BadRequestException(`Room ${room.roomNumber} is already full for this paper.`);

    const alreadySeated = await this.prisma.examSeating.findMany({
      where: { examRoom: { scheduleId: schedule.id } },
      select: { studentId: true },
    });

    const candidates = await this.prisma.student.findMany({
      where: {
        deletedAt: null,
        isDebarred: false,
        programId: schedule.subject.programId,
        semester: schedule.subject.semester,
        id: { notIn: alreadySeated.map((s) => s.studentId) },
      },
      include: { department: { select: { code: true } } },
      orderBy: { rollNumber: 'asc' },
    });
    if (candidates.length === 0) throw new BadRequestException('No unseated eligible candidates remain for this paper.');

    const ordered = interleaveByGroup(candidates, (c) => c.department.code).slice(0, freeSeats);
    const positions = seatPositions(examRoom._count.seatings + ordered.length, dto.columns ?? DEFAULT_DESKS_PER_ROW).slice(
      examRoom._count.seatings,
    );

    const seats = ordered.map((student, i) => ({ student, ...positions[i] }));
    await this.prisma.examSeating.createMany({
      data: seats.map((s) => ({
        examRoomId: examRoom.id,
        studentId: s.student.id,
        seatNumber: s.seatNumber,
        deskRow: s.deskRow,
        deskCol: s.deskCol,
      })),
    });

    return {
      examRoomId: examRoom.id,
      roomNumber: room.roomNumber,
      examDate: formatDate(schedule.date),
      subjectCode: schedule.subject.code,
      totalCapacity: room.capacity,
      allocatedCount: examRoom._count.seatings + seats.length,
      unseatedCandidates: candidates.length - seats.length,
      seatingMatrix: seats.map((s) => ({
        seatNumber: s.seatNumber,
        deskRow: s.deskRow,
        deskCol: s.deskCol,
        allocatedRoll: s.student.rollNumber,
        allocatedBranch: s.student.department.code,
      })),
    };
  }

  /** Upserts one assessment's marks for a subject (and optional section). */
  async recordMarks(dto: RecordMarksDto) {
    const subject = await this.prisma.subject.findUnique({ where: { code: dto.subjectCode } });
    if (!subject) throw new BadRequestException(`Unknown subject code: ${dto.subjectCode}`);

    const section = dto.section ? await this.prisma.section.findFirst({ where: { name: dto.section } }) : null;
    if (dto.section && !section) throw new BadRequestException(`Unknown section: ${dto.section}`);

    const tooHigh = dto.records.find((r) => r.marksObtained > dto.maxMarks);
    if (tooHigh) {
      throw new BadRequestException(`Marks for student ${tooHigh.studentId} exceed the maximum of ${dto.maxMarks}.`);
    }

    const assessment =
      (await this.prisma.assessment.findFirst({
        where: { subjectId: subject.id, sectionId: section?.id ?? null, type: dto.assessmentType },
      })) ??
      (await this.prisma.assessment.create({
        data: {
          subjectId: subject.id,
          sectionId: section?.id,
          type: dto.assessmentType,
          title: `${subject.code} ${dto.assessmentType.replace(/_/g, ' ')}`,
          maxMarks: dto.maxMarks,
        },
      }));

    await this.prisma.$transaction(
      dto.records.map((r) =>
        this.prisma.mark.upsert({
          where: { assessmentId_studentId: { assessmentId: assessment.id, studentId: r.studentId } },
          update: { marksObtained: r.marksObtained, isAbsent: r.isAbsent ?? false },
          create: {
            assessmentId: assessment.id,
            studentId: r.studentId,
            marksObtained: r.marksObtained,
            isAbsent: r.isAbsent ?? false,
          },
        }),
      ),
    );

    return {
      success: true,
      assessmentId: assessment.id,
      subjectCode: subject.code,
      assessmentType: dto.assessmentType,
      savedCount: dto.records.length,
      message: `Saved ${dto.records.length} mark entries for ${subject.code}.`,
    };
  }

  /**
   * Grade card for the student's latest published semester (or current semester if
   * none is published yet), built from real Assessment / Mark rows. Subjects with
   * no marks yet are listed with status PENDING rather than invented grades.
   */
  async getStudentGradeCard(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { name: true } },
        program: true,
        results: { where: { status: { in: PUBLISHED_RESULT_STATUSES } }, orderBy: { semester: 'desc' }, take: 1 },
      },
    });
    if (!student) throw new NotFoundException('Student profile not found.');

    const result = student.results[0] ?? null;
    const semester = result?.semester ?? student.semester;

    const subjects = await this.prisma.subject.findMany({
      where: { programId: student.programId, semester },
      include: { assessments: { include: { marks: { where: { studentId } } } } },
      orderBy: { code: 'asc' },
    });

    const courses = subjects.map((subject) => {
      let internal = 0;
      let external = 0;
      let max = 0;
      for (const assessment of subject.assessments) {
        const mark = assessment.marks[0];
        if (!mark) continue;
        max += assessment.maxMarks;
        const obtained = mark.isAbsent ? 0 : mark.marksObtained;
        if (assessment.type === AssessmentType.END_SEM) external += obtained;
        else internal += obtained;
      }

      if (max === 0) {
        return {
          code: subject.code,
          title: subject.name,
          credits: subject.credits,
          internalMarks: null,
          externalMarks: null,
          totalMarks: null,
          maxMarks: null,
          grade: null,
          gradePoints: null,
          status: 'PENDING' as const,
        };
      }

      const band = gradeFor(((internal + external) / max) * 100);
      return {
        code: subject.code,
        title: subject.name,
        credits: subject.credits,
        internalMarks: internal,
        externalMarks: external,
        totalMarks: internal + external,
        maxMarks: max,
        grade: band.grade,
        gradePoints: band.gradePoint,
        status: band.gradePoint >= PASSING_GRADE_POINT ? ('PASS' as const) : ('FAIL' as const),
      };
    });

    const graded = courses.filter((c) => c.status !== 'PENDING');
    const passedCredits = graded.filter((c) => c.status === 'PASS').reduce((sum, c) => sum + c.credits, 0);

    return {
      studentId: student.id,
      rollNumber: student.rollNumber,
      studentName: student.user.name,
      program: student.program.name,
      semester,
      academicYear: result?.academicYear ?? null,
      resultStatus: result?.status ?? 'NOT_PUBLISHED',
      publishedAt: result?.publishedAt ?? null,
      // The officially published SGPA wins over our recomputation when it exists.
      sgpa: result?.sgpa ?? computeSgpa(graded.map((c) => ({ credits: c.credits, gradePoint: c.gradePoints }))),
      cgpa: result?.cgpa ?? student.cgpa,
      totalCreditsEarned: result?.totalCreditsEarned ?? passedCredits,
      backlogs: graded.filter((c) => c.status === 'FAIL').length,
      subjects: courses,
    };
  }
}
