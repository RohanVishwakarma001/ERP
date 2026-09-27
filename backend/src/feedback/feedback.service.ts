import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) {}

  async submitFeedback(data: { category: string; rating: number; comments: string; isAnonymous?: boolean }) {
    return {
      success: true,
      message: 'Feedback submitted to Internal Quality Assurance Cell (IQAC).',
      feedbackId: `fb-${Date.now()}`,
      recordedAt: new Date().toISOString(),
    };
  }
}
