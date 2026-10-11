import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { AssignmentStatus, Prisma, SubmissionStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreateAssignmentDto, GradeSubmissionDto } from './dto/assignments.dto';

const ASSIGNMENT_INCLUDE = {
  subject: { select: { code: true, name: true } },
  faculty: { include: { user: { select: { name: true } } } },
  section: { select: { name: true, _count: { select: { students: true } } } },
  submissions: { select: { studentId: true, status: true, marksObtained: true, submittedAt: true, feedback: true } },
} satisfies Prisma.AssignmentInclude;

type AssignmentRow = Prisma.AssignmentGetPayload<{ include: typeof ASSIGNMENT_INCLUDE }>;

@Injectable()
export class AssignmentsService {
  constructor(private prisma: PrismaService) {}

  /** Students see published work for their section; faculty see what they set; staff see all. */
  async findAll(user: AuthUser) {
    const assignments = await this.prisma.assignment.findMany({
      where: await this.scopeFor(user),
      include: ASSIGNMENT_INCLUDE,
      orderBy: { deadline: 'asc' },
    });
    return assignments.map((a) => this.toView(a, user.studentId));
  }

  async findById(id: string, user: AuthUser) {
    const assignment = await this.prisma.assignment.findFirst({
      where: { id, ...(await this.scopeFor(user)) },
      include: ASSIGNMENT_INCLUDE,
    });
    if (!assignment) throw new NotFoundException('Assignment not found.');
    return this.toView(assignment, user.studentId);
  }

  async submitAssignment(assignmentId: string, studentId: string, fileUrl: string) {
    const [assignment, student] = await Promise.all([
      this.prisma.assignment.findUnique({ where: { id: assignmentId } }),
      this.prisma.student.findUnique({ where: { id: studentId }, select: { sectionId: true } }),
    ]);
    if (!assignment || assignment.status !== AssignmentStatus.PUBLISHED) throw new NotFoundException('Assignment not found.');
    if (!student || student.sectionId !== assignment.sectionId) {
      throw new BadRequestException('This assignment was not set for your section.');
    }
    if (new Date() > assignment.deadline) throw new BadRequestException('The deadline for this assignment has passed.');

    const submission = await this.prisma.assignmentSubmission.upsert({
      where: { assignmentId_studentId: { assignmentId, studentId } },
      update: { fileUrl, submittedAt: new Date() },
      create: { assignmentId, studentId, fileUrl },
    });

    return {
      success: true,
      assignmentId,
      submittedAt: submission.submittedAt.toISOString(),
      status: submission.status,
    };
  }

  // ── Faculty ────────────────────────────────────────────────────────────────

  /** Faculty / HODs set work for a section in a course of their own department. */
  async create(dto: CreateAssignmentDto, user: AuthUser) {
    const facultyId = this.requireFaculty(user);
    const [subject, section] = await Promise.all([
      this.prisma.subject.findUnique({ where: { id: dto.subjectId } }),
      this.prisma.section.findUnique({ where: { id: dto.sectionId } }),
    ]);
    if (!subject) throw new BadRequestException('The selected course no longer exists.');
    if (!section) throw new BadRequestException('The selected section no longer exists.');
    if (subject.departmentId !== user.departmentId) {
      throw new ForbiddenException('You can only set assignments for courses of your own department.');
    }
    const deadline = new Date(dto.deadline);
    if (deadline <= new Date()) throw new BadRequestException('The deadline must be in the future.');

    const created = await this.prisma.assignment.create({
      data: {
        subjectId: subject.id,
        sectionId: section.id,
        facultyId,
        title: dto.title,
        description: dto.description,
        deadline,
        maxMarks: dto.maxMarks,
        attachmentUrl: dto.attachmentUrl ?? null,
        status: AssignmentStatus.PUBLISHED,
      },
    });
    return this.findById(created.id, user);
  }

  /** Stops new submissions. */
  async close(id: string, user: AuthUser) {
    await this.requireOwned(id, user);
    await this.prisma.assignment.update({ where: { id }, data: { status: AssignmentStatus.CLOSED } });
    return this.findById(id, user);
  }

  /** Every student of the section with their submission (or none), for the faculty member who set it. */
  async listSubmissions(id: string, user: AuthUser) {
    const assignment = await this.requireOwned(id, user);
    const [students, submissions] = await Promise.all([
      this.prisma.student.findMany({
        where: { sectionId: assignment.sectionId, deletedAt: null },
        select: { id: true, rollNumber: true, user: { select: { name: true } } },
        orderBy: { rollNumber: 'asc' },
      }),
      this.prisma.assignmentSubmission.findMany({ where: { assignmentId: id } }),
    ]);
    const byStudent = new Map(submissions.map((sub) => [sub.studentId, sub]));
    return {
      assignment: { id: assignment.id, title: assignment.title, maxMarks: assignment.maxMarks, deadline: assignment.deadline.toISOString() },
      students: students.map((st) => {
        const sub = byStudent.get(st.id);
        return {
          studentId: st.id,
          name: st.user.name,
          rollNumber: st.rollNumber,
          submission: sub
            ? {
                fileUrl: sub.fileUrl,
                submittedAt: sub.submittedAt.toISOString(),
                late: sub.submittedAt > assignment.deadline,
                status: sub.status,
                marksObtained: sub.marksObtained,
                feedback: sub.feedback,
              }
            : null,
        };
      }),
    };
  }

  async grade(id: string, studentId: string, dto: GradeSubmissionDto, user: AuthUser) {
    const assignment = await this.requireOwned(id, user);
    if (dto.marksObtained > assignment.maxMarks) throw new BadRequestException(`Marks can't exceed ${assignment.maxMarks}.`);
    const submission = await this.prisma.assignmentSubmission.findUnique({ where: { assignmentId_studentId: { assignmentId: id, studentId } } });
    if (!submission) throw new NotFoundException('This student has not submitted the assignment.');
    await this.prisma.assignmentSubmission.update({
      where: { id: submission.id },
      data: { marksObtained: dto.marksObtained, feedback: dto.feedback ?? null, status: SubmissionStatus.EVALUATED },
    });
    return { studentId, marksObtained: dto.marksObtained, status: SubmissionStatus.EVALUATED };
  }

  private requireFaculty(user: AuthUser) {
    if (!user.facultyId) throw new ForbiddenException('Only faculty members can set assignments.');
    return user.facultyId;
  }

  /** The assignment, if the caller set it (admins may act on any). */
  private async requireOwned(id: string, user: AuthUser) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id } });
    if (!assignment) throw new NotFoundException('Assignment not found.');
    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
    if (!isAdmin && assignment.facultyId !== user.facultyId) throw new ForbiddenException('You can only manage assignments you set.');
    return assignment;
  }

  private async scopeFor(user: AuthUser): Promise<Prisma.AssignmentWhereInput> {
    if (user.role === UserRole.STUDENT) {
      const student = user.studentId
        ? await this.prisma.student.findUnique({ where: { id: user.studentId }, select: { sectionId: true } })
        : null;
      return { status: AssignmentStatus.PUBLISHED, sectionId: student?.sectionId ?? '__none__' };
    }
    if (user.role === UserRole.FACULTY && user.facultyId) return { facultyId: user.facultyId };
    return {};
  }

  private toView(a: AssignmentRow, studentId?: string) {
    const mine = studentId ? a.submissions.find((s) => s.studentId === studentId) : undefined;
    return {
      id: a.id,
      subjectId: a.subjectId,
      sectionId: a.sectionId,
      subjectCode: a.subject.code,
      subjectName: a.subject.name,
      section: a.section.name,
      title: a.title,
      description: a.description,
      deadline: a.deadline.toISOString(),
      faculty: a.faculty.user.name,
      maxMarks: a.maxMarks,
      attachmentUrl: a.attachmentUrl,
      status: a.status,
      submissionsCount: a.submissions.length,
      totalStudents: a.section._count.students,
      // Per-student state, distinct from `status` (the assignment's publish state).
      mySubmissionStatus: mine ? mine.status : studentId ? 'PENDING' : null,
      myMarks: mine?.marksObtained ?? null,
      myFeedback: mine?.feedback ?? null,
    };
  }
}
