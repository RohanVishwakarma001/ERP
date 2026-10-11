import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

const NOTIFICATION_PAGE_SIZE = 50;

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getMyNotifications(userId: string) {
    const [items, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: NOTIFICATION_PAGE_SIZE,
      }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return {
      unreadCount,
      items: items.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        category: n.category,
        link: n.link,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      })),
    };
  }

  /** Scoped by userId so one user can never mark another's notification. */
  async markAsRead(id: string, userId: string) {
    const { count } = await this.prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
    if (count === 0) throw new NotFoundException('Notification not found.');
    return { success: true };
  }

  async markAllAsRead(userId: string) {
    const { count } = await this.prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
    return { success: true, updated: count };
  }
}
