import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { AppConfig } from '../../config';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@ApiTags('System Health')
@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private config: AppConfig,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Check API and database operational status (503 when the DB is unreachable)' })
  async check(@Res({ passthrough: true }) res: Response) {
    let database: 'CONNECTED' | 'OFFLINE' = 'CONNECTED';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'OFFLINE';
    }

    const healthy = database === 'CONNECTED';
    res.status(healthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);

    return {
      status: healthy ? 'OPERATIONAL' : 'DEGRADED',
      environment: this.config.nodeEnv,
      timestamp: new Date().toISOString(),
      services: { api: 'UP', database },
    };
  }
}
