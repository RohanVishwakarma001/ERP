import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MOCK_NOTICES = [
  {
    id: 'not-01',
    title: 'UTU End-Semester Practical Exam Schedule (Even Sem 2026)',
    category: 'EXAMINATION' as const,
    date: '24 May 2026',
    publisher: 'Office of Controller of Examinations',
    author: 'Office of Controller of Examinations',
    summary: 'Practical examinations for B.Tech Sem IV, VI & VIII commence from June 2, 2026. Hall tickets available for download.',
    priority: 'URGENT' as const,
    isUrgent: true,
    publishedAt: new Date().toISOString(),
  },
  {
    id: 'not-02',
    title: 'Campus Placement Drive: Infosys SpringBoard & TCS Digital',
    category: 'PLACEMENT' as const,
    date: '23 May 2026',
    publisher: 'Training & Placement Cell',
    author: 'Training & Placement Cell',
    summary: 'Registration open for 2026 graduating batch with CGPA >= 7.00. Last date to submit LOI is May 28.',
    priority: 'HIGH' as const,
    isUrgent: false,
    publishedAt: new Date().toISOString(),
  },
  {
    id: 'not-03',
    title: 'Statutory 75% Attendance Compliance Notice (UTU Ordinance 14B)',
    category: 'ACADEMIC' as const,
    date: '21 May 2026',
    publisher: 'Academic Council & Dean Office',
    author: 'Academic Council & Dean Office',
    summary: 'Students failing to maintain a cumulative 75% attendance threshold across theory and lab subjects will be debarred from semester examinations.',
    priority: 'URGENT' as const,
    isUrgent: true,
    publishedAt: new Date().toISOString(),
  },
  {
    id: 'not-04',
    title: 'Central Knowledge Repository & Library Book Clearance for Final Semesters',
    category: 'ADMINISTRATION' as const,
    date: '19 May 2026',
    publisher: 'Chief Librarian',
    author: 'Chief Librarian',
    summary: 'All students are reminded to return overdue books to the Central Library before June 10 to avoid RFID fine accruals.',
    priority: 'NORMAL' as const,
    isUrgent: false,
    publishedAt: new Date().toISOString(),
  },
];

@Injectable()
export class NoticesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    if (this.prisma.isConnected) {
      try {
        const notices = await this.prisma.notice.findMany({
          where: { status: 'PUBLISHED' },
          orderBy: { publishedAt: 'desc' },
        });

        if (notices && notices.length > 0) {
          return notices.map((n) => ({
            id: n.id,
            title: n.title,
            category: (n.category === 'EXAM' ? 'EXAMINATION' : n.category === 'CIRCULAR' ? 'ADMINISTRATION' : n.category) as any,
            date: new Date(n.publishedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
            publisher: n.authorName,
            author: n.authorName,
            summary: n.summary,
            priority: (n.isUrgent ? 'URGENT' : 'NORMAL') as 'HIGH' | 'NORMAL' | 'URGENT',
            isUrgent: n.isUrgent,
            publishedAt: n.publishedAt.toISOString(),
          }));
        }
      } catch {
        // Fallback
      }
    }
    return MOCK_NOTICES;
  }

  async findById(id: string) {
    if (this.prisma.isConnected) {
      try {
        const n = await this.prisma.notice.findUnique({ where: { id } });
        if (n) {
          return {
            id: n.id,
            title: n.title,
            category: (n.category === 'EXAM' ? 'EXAMINATION' : n.category === 'CIRCULAR' ? 'ADMINISTRATION' : n.category) as any,
            date: new Date(n.publishedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
            publisher: n.authorName,
            author: n.authorName,
            summary: n.summary,
            content: n.content,
            priority: (n.isUrgent ? 'URGENT' : 'NORMAL') as 'HIGH' | 'NORMAL' | 'URGENT',
            isUrgent: n.isUrgent,
            publishedAt: n.publishedAt.toISOString(),
          };
        }
      } catch {
        // Fallback
      }
    }
    return MOCK_NOTICES.find((n) => n.id === id) || MOCK_NOTICES[0];
  }

  async create(data: any) {
    if (this.prisma.isConnected) {
      try {
        const n = await this.prisma.notice.create({
          data: {
            title: data.title || 'New Institutional Notice',
            summary: data.summary || data.description || '',
            content: data.content || data.description || '',
            category: data.category === 'EXAMINATION' ? 'EXAM' : data.category === 'ADMINISTRATION' ? 'CIRCULAR' : data.category || 'CIRCULAR',
            authorName: data.author || data.publisher || 'Registrar Office',
            isUrgent: data.priority === 'URGENT' || data.isUrgent || false,
            status: 'PUBLISHED',
          },
        });
        return {
          id: n.id,
          title: n.title,
          category: data.category || 'ADMINISTRATION',
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
          publisher: n.authorName,
          summary: n.summary,
          priority: n.isUrgent ? 'URGENT' : 'NORMAL',
          isUrgent: n.isUrgent,
          publishedAt: n.publishedAt.toISOString(),
        };
      } catch {
        // Fallback
      }
    }

    const newNotice = {
      id: `not-${Date.now()}`,
      title: data.title,
      category: data.category || 'ADMINISTRATION',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
      publisher: data.author || 'Registrar Office',
      author: data.author || 'Registrar Office',
      summary: data.summary,
      priority: data.priority || 'NORMAL',
      isUrgent: data.priority === 'URGENT',
      publishedAt: new Date().toISOString(),
    };
    MOCK_NOTICES.unshift(newNotice as any);
    return newNotice;
  }
}
