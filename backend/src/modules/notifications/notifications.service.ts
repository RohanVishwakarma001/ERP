import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MOCK_NOTIFICATIONS = [
  {
    id: 'ntf-01',
    title: 'Admit Card Available',
    message: 'Your End-Semester Theory Admit Card for Even Sem 2026 is ready for download.',
    category: 'EXAM',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ntf-02',
    title: 'Fee Payment Verified',
    message: 'Receipt JBIT/REC/2026/0942 generated successfully for INR 42,500.',
    category: 'FEE',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ntf-03',
    title: 'New Assignment Published',
    message: 'Prof. Ananya Sen uploaded Lab Report requirements for Cloud Computing.',
    category: 'ASSIGNMENT',
    isRead: true,
    createdAt: new Date().toISOString(),
  },
];

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getMyNotifications(userId: string) {
    return MOCK_NOTIFICATIONS;
  }

  async markAsRead(id: string) {
    return { success: true, message: 'Notification marked as read.' };
  }

  async markAllAsRead(userId: string) {
    return { success: true, message: 'All notifications marked as read.' };
  }
}
