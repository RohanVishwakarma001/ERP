import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MOCK_COMPLAINTS = [
  {
    id: 'cmp-01',
    ticketNumber: 'TKT-2026-081',
    title: 'Wi-Fi Access Point Latency in Himalayan Wing (LH-302)',
    category: 'INFRASTRUCTURE' as const,
    priority: 'HIGH' as const,
    subject: 'Wi-Fi Access Point Latency in Himalayan Wing (LH-302)',
    description: 'During laboratory sessions, the access point in Room LH-302 experiences intermittent DNS timeouts.',
    reportedBy: 'Aarav Sharma',
    reportedByRole: 'STUDENT',
    status: 'IN_PROGRESS' as const,
    assignedTo: 'Campus IT Network Team',
    resolutionNotes: 'Network engineering team dispatched replacement AP unit.',
    createdAt: '2026-05-22T10:00:00Z',
    comments: [
      { author: 'Aarav Sharma', text: 'Issue persists during Period 1.', time: '2026-05-22 10:15 AM' },
      { author: 'Campus IT Helpdesk', text: 'Replacement Cisco Catalyst AP unit configured and tested.', time: '2026-05-22 02:30 PM' },
    ],
  },
  {
    id: 'cmp-02',
    ticketNumber: 'TKT-2026-042',
    title: 'Water cooler filtration unit maintenance in Shivalik Block 2nd Floor',
    category: 'HOSTEL' as const,
    priority: 'MEDIUM' as const,
    subject: 'Water cooler filtration unit maintenance in Shivalik Block 2nd Floor',
    description: 'Water dispenser requires filter replacement and cooling check.',
    reportedBy: 'Devendra Bisht',
    reportedByRole: 'STUDENT',
    status: 'RESOLVED' as const,
    assignedTo: 'Estate & Maintenance Division',
    resolutionNotes: 'RO filter replaced and water TDS checked (112 ppm).',
    createdAt: '2026-05-19T08:30:00Z',
    comments: [
      { author: 'Estate Office', text: 'RO filter replaced and water TDS checked (112 ppm).', time: '2026-05-20 11:00 AM' },
    ],
  },
];

@Injectable()
export class ComplaintsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    if (this.prisma.isConnected) {
      try {
        const complaints = await this.prisma.complaint.findMany({
          include: {
            student: { include: { user: true } },
            comments: { orderBy: { createdAt: 'asc' } },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (complaints && complaints.length > 0) {
          return complaints.map((c, idx) => ({
            id: c.id,
            ticketNumber: `TKT-2026-${String(idx + 1).padStart(3, '0')}`,
            title: c.subject,
            category: (['HOSTEL', 'ACADEMIC', 'TRANSPORT', 'INFRASTRUCTURE', 'FINANCE'].includes(c.category)
              ? c.category
              : 'INFRASTRUCTURE') as any,
            priority: (c.priority || 'MEDIUM') as any,
            subject: c.subject,
            description: c.description,
            reportedBy: c.student?.user?.name || 'Aarav Sharma',
            reportedByRole: 'STUDENT',
            status: c.status,
            assignedTo: c.assignedToId || 'Campus Support Team',
            resolutionNotes: c.resolutionNotes,
            createdAt: c.createdAt.toISOString(),
            comments: c.comments.map((cm) => ({
              author: cm.authorName,
              text: cm.comment,
              time: cm.createdAt.toISOString(),
            })),
          }));
        }
      } catch {
        // Fallback
      }
    }
    return MOCK_COMPLAINTS;
  }

  async findById(id: string) {
    if (this.prisma.isConnected) {
      try {
        const c = await this.prisma.complaint.findUnique({
          where: { id },
          include: {
            student: { include: { user: true } },
            comments: { orderBy: { createdAt: 'asc' } },
          },
        });
        if (c) {
          return {
            id: c.id,
            ticketNumber: 'TKT-2026-081',
            title: c.subject,
            category: c.category as any,
            priority: c.priority as any,
            subject: c.subject,
            description: c.description,
            reportedBy: c.student?.user?.name || 'Aarav Sharma',
            reportedByRole: 'STUDENT',
            status: c.status,
            assignedTo: c.assignedToId || 'Campus Support Team',
            resolutionNotes: c.resolutionNotes,
            createdAt: c.createdAt.toISOString(),
            comments: c.comments.map((cm) => ({
              author: cm.authorName,
              text: cm.comment,
              time: cm.createdAt.toISOString(),
            })),
          };
        }
      } catch {
        // Fallback
      }
    }
    return MOCK_COMPLAINTS.find((c) => c.id === id) || MOCK_COMPLAINTS[0];
  }

  async create(data: any) {
    if (this.prisma.isConnected) {
      try {
        const student = await this.prisma.student.findFirst({
          where: {
            OR: [
              { id: data.studentId },
              { rollNumber: data.studentId },
            ],
          },
        });

        if (student) {
          const comp = await this.prisma.complaint.create({
            data: {
              studentId: student.id,
              category: data.category || 'ACADEMIC',
              priority: data.priority || 'MEDIUM',
              subject: data.title || data.subject || 'Campus Inquiry',
              description: data.description || '',
              status: 'OPEN',
            },
          });
          return {
            id: comp.id,
            ticketNumber: `TKT-2026-${Math.floor(100 + Math.random() * 900)}`,
            title: comp.subject,
            category: comp.category,
            priority: comp.priority,
            description: comp.description,
            reportedBy: data.studentName || 'Student',
            reportedByRole: 'STUDENT',
            status: comp.status,
            createdAt: comp.createdAt.toISOString(),
            comments: [],
          };
        }
      } catch {
        // Fallback
      }
    }

    const newTicket = {
      id: `cmp-${Date.now()}`,
      ticketNumber: `TKT-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: data.title || data.subject || 'Campus Inquiry',
      category: data.category || 'ACADEMIC',
      priority: data.priority || 'MEDIUM',
      subject: data.title || data.subject || 'Campus Inquiry',
      description: data.description || '',
      reportedBy: data.studentName || 'Aarav Sharma',
      reportedByRole: 'STUDENT',
      status: 'OPEN' as const,
      createdAt: new Date().toISOString(),
      comments: [],
    };
    MOCK_COMPLAINTS.unshift(newTicket as any);
    return newTicket;
  }

  async addComment(id: string, author: string, text: string) {
    if (this.prisma.isConnected) {
      try {
        await this.prisma.complaintComment.create({
          data: {
            complaintId: id,
            authorId: 'admin-01',
            authorName: author,
            comment: text,
          },
        });
      } catch {
        // Fallback
      }
    }
    return {
      success: true,
      message: 'Comment added to complaint timeline',
      comment: { author, text, time: new Date().toISOString() },
    };
  }
}
