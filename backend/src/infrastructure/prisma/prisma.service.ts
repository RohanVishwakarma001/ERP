import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Connected to PostgreSQL.');
    } catch (error) {
      // Don't crash boot: a serverless DB may still be waking. Prisma connects lazily
      // on the next query, and failures surface as 503s via GlobalHttpExceptionFilter.
      this.logger.warn(`Initial database connection failed; will retry on first query: ${(error as Error).message}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
