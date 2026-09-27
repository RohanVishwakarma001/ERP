import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('System Health')
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Check API and database operational status' })
  async check(@Res({ passthrough: true }) res: Response) {
    let dbStatus: 'CONNECTED' | 'OFFLINE' = 'CONNECTED';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'OFFLINE';
    }

    const healthy = dbStatus === 'CONNECTED';
    res.status(healthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);

    return {
      status: healthy ? 'OPERATIONAL' : 'DEGRADED',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      institution: 'JB Institute of Technology, Dehradun',
      timestamp: new Date().toISOString(),
      services: {
        api: 'UP',
        database: dbStatus,
      },
    };
  }
}
