import { Injectable, BadRequestException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MOCK_ASSIGNMENTS = [
  {
    id: 'asn-01',
    subject: 'CS-601 Compiler Design',
    subjectCode: 'CS-601',
    title: 'Assignment 3: LL(1) Parser Implementation with Left-Factoring',
    description: 'Implement a shift-reduce or predictive LL(1) parsing table generator in C++/Python with conflict resolution for ambiguous grammar rules.',
    deadline: new Date(Date.now() + 86400000 * 7).toISOString(),
    faculty: 'Dr. V. K. Bhatt',
    maxMarks: 20,
    submissionsCount: 48,
    totalStudents: 60,
    status: 'PUBLISHED',
  },
  {
    id: 'asn-02',
    subject: 'CS-602 Cloud Computing & DevOps',
    subjectCode: 'CS-602',
    title: 'Lab Report: Multi-Tier Microservice Deployment on Kubernetes',
    description: 'Write Helm charts and Kubernetes manifests for deploying a Node.js + Redis service with Horizontal Pod Autoscaling (HPA) and Ingress controllers.',
    deadline: new Date(Date.now() + 86400000 * 10).toISOString(),
    faculty: 'Prof. Ananya Sen',
    maxMarks: 20,
    submissionsCount: 52,
    totalStudents: 60,
    status: 'PUBLISHED',
  },
];

@Injectable()
export class AssignmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(studentId?: string) {
    if (this.prisma.isConnected) {
      try {
        const assignments = await this.prisma.assignment.findMany({
          include: {
            subject: true,
            faculty: { include: { user: true } },
            submissions: true,
          },
          orderBy: { deadline: 'asc' },
        });

        if (assignments && assignments.length > 0) {
          return assignments.map((a) => ({
            id: a.id,
            subject: `${a.subject.code} ${a.subject.name}`,
            subjectCode: a.subject.code,
            title: a.title,
            description: a.description,
            deadline: a.deadline.toISOString(),
            faculty: a.faculty.user.name,
            maxMarks: a.maxMarks,
            submissionsCount: a.submissions.length,
            totalStudents: 60,
            status: a.status,
            // Whether THIS student has submitted — distinct from `status`, which is the
            // assignment's own publish state (PUBLISHED/DRAFT/CLOSED), not per-student.
            mySubmissionStatus: studentId && a.submissions.some((s) => s.studentId === studentId) ? 'SUBMITTED' : 'PENDING',
          }));
        }
      } catch {
        // Fallback
      }
    }
    return MOCK_ASSIGNMENTS;
  }

  async findById(id: string, studentId?: string) {
    if (this.prisma.isConnected) {
      try {
        const a = await this.prisma.assignment.findUnique({
          where: { id },
          include: {
            subject: true,
            faculty: { include: { user: true } },
            submissions: true,
          },
        });
        if (a) {
          return {
            id: a.id,
            subject: `${a.subject.code} ${a.subject.name}`,
            subjectCode: a.subject.code,
            title: a.title,
            description: a.description,
            deadline: a.deadline.toISOString(),
            faculty: a.faculty.user.name,
            maxMarks: a.maxMarks,
            submissionsCount: a.submissions.length,
            totalStudents: 60,
            status: a.status,
            mySubmissionStatus: studentId && a.submissions.some((s) => s.studentId === studentId) ? 'SUBMITTED' : 'PENDING',
          };
        }
      } catch {
        // Fallback
      }
    }
    return MOCK_ASSIGNMENTS.find((a) => a.id === id) || MOCK_ASSIGNMENTS[0];
  }

  async submitAssignment(assignmentId: string, studentId: string, fileUrl: string) {
    if (!this.prisma.isConnected) {
      throw new ServiceUnavailableException(
        'Submission database is currently unreachable. Please try again shortly — this file was NOT submitted.',
      );
    }

    const assignment = await this.prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) {
      throw new NotFoundException('Assignment not found.');
    }
    if (new Date() > assignment.deadline) {
      throw new BadRequestException('The deadline for this assignment has passed.');
    }

    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      throw new BadRequestException('Student profile not found for this account.');
    }

    const submission = await this.prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: student.id,
        },
      },
      update: {
        fileUrl,
        submittedAt: new Date(),
      },
      create: {
        assignmentId,
        studentId: student.id,
        fileUrl,
      },
    });

    return {
      success: true,
      message: 'Assignment submitted successfully.',
      assignmentId,
      studentId: student.id,
      submittedAt: submission.submittedAt.toISOString(),
      status: 'SUBMITTED',
    };
  }
}
