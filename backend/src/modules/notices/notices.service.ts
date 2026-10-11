import { Injectable, NotFoundException } from '@nestjs/common';
import { Notice, NoticeStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateNoticeDto } from './dto/notices.dto';

@Injectable()
export class NoticesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const notices = await this.prisma.notice.findMany({
      where: { status: NoticeStatus.PUBLISHED },
      orderBy: [{ isUrgent: 'desc' }, { publishedAt: 'desc' }],
    });
    return notices.map((n) => this.toView(n));
  }

  async findById(id: string) {
    const notice = await this.prisma.notice.findFirst({ where: { id, status: NoticeStatus.PUBLISHED } });
    if (!notice) throw new NotFoundException('Notice not found.');
    return { ...this.toView(notice), content: notice.content };
  }

  async create(dto: CreateNoticeDto, publisherName: string) {
    const notice = await this.prisma.notice.create({
      data: {
        title: dto.title.trim(),
        summary: dto.summary.trim(),
        content: dto.content?.trim(),
        category: dto.category,
        isUrgent: dto.isUrgent ?? false,
        authorName: dto.authorName?.trim() || publisherName,
        status: NoticeStatus.PUBLISHED,
      },
    });
    return this.toView(notice);
  }

  private toView(n: Notice) {
    return {
      id: n.id,
      title: n.title,
      summary: n.summary,
      category: n.category,
      authorName: n.authorName,
      isUrgent: n.isUrgent,
      publishedAt: n.publishedAt.toISOString(),
    };
  }
}
