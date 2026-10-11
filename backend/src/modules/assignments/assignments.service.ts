import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AssignmentStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';

const ASSIGNMENT_INCLUDE = {
  subject: { select: { code: true, name: true } },
  faculty: { include: { user: { select: { name: true } } } },
  section: { select: { name: true, _count: { select: { students: true } } } },
  submissions: { select: { studentId: true, status: true, marksObtained: true, submittedAt: true } },
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
      subjectCode: a.subject.code,
      subjectName: a.subject.name,
      section: a.section.name,
      title: a.title,
      description: a.description,
      deadline: a.deadline.toISOString(),
      faculty: a.faculty.user.name,
      maxMarks: a.maxMarks,
      status: a.status,
      submissionsCount: a.submissions.length,
      totalStudents: a.section._count.students,
      // Per-student state, distinct from `status` (the assignment's publish state).
      mySubmissionStatus: mine ? mine.status : studentId ? 'PENDING' : null,
      myMarks: mine?.marksObtained ?? null,
    };
  }
}
