import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ComplaintStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreateComplaintDto } from './dto/complaints.dto';

const COMPLAINT_INCLUDE = {
  student: { include: { user: { select: { name: true } } } },
  comments: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.ComplaintInclude;

type ComplaintRow = Prisma.ComplaintGetPayload<{ include: typeof COMPLAINT_INCLUDE }>;

/** Stable, human-friendly reference derived from the primary key. */
const ticketNumberFor = (id: string) => `TKT-${id.slice(0, 8).toUpperCase()}`;

@Injectable()
export class ComplaintsService {
  constructor(private prisma: PrismaService) {}

  /** Students see their own tickets; staff see everything. */
  async findAll(user: AuthUser) {
    const complaints = await this.prisma.complaint.findMany({
      where: this.visibleTo(user),
      include: COMPLAINT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return complaints.map((c) => this.toView(c));
  }

  async findById(id: string, user: AuthUser) {
    const complaint = await this.prisma.complaint.findFirst({ where: { id, ...this.visibleTo(user) }, include: COMPLAINT_INCLUDE });
    if (!complaint) throw new NotFoundException('Complaint not found.');
    return this.toView(complaint);
  }

  async create(studentId: string, dto: CreateComplaintDto) {
    const complaint = await this.prisma.complaint.create({
      data: {
        studentId,
        category: dto.category,
        priority: dto.priority ?? 'MEDIUM',
        subject: dto.title.trim(),
        description: dto.description.trim(),
        status: ComplaintStatus.OPEN,
      },
      include: COMPLAINT_INCLUDE,
    });
    return this.toView(complaint);
  }

  async addComment(id: string, user: AuthUser, text: string) {
    await this.findById(id, user); // enforces visibility
    const comment = await this.prisma.complaintComment.create({
      data: { complaintId: id, authorId: user.id, authorName: user.name, comment: text.trim() },
    });
    return { author: comment.authorName, text: comment.comment, time: comment.createdAt.toISOString() };
  }

  private visibleTo(user: AuthUser): Prisma.ComplaintWhereInput {
    if (user.role !== UserRole.STUDENT) return {};
    if (!user.studentId) throw new ForbiddenException('This account has no student profile.');
    return { studentId: user.studentId };
  }

  private toView(c: ComplaintRow) {
    return {
      id: c.id,
      ticketNumber: ticketNumberFor(c.id),
      title: c.subject,
      category: c.category,
      priority: c.priority,
      description: c.description,
      reportedBy: c.student.user.name,
      reportedByRole: 'STUDENT' as const,
      status: c.status,
      assignedTo: c.assignedToId,
      resolutionNotes: c.resolutionNotes,
      createdAt: c.createdAt.toISOString(),
      comments: c.comments.map((cm) => ({ author: cm.authorName, text: cm.comment, time: cm.createdAt.toISOString() })),
    };
  }
}
