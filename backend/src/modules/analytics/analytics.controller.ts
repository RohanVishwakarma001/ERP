import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators';
import { UserRole } from '@prisma/client';

@ApiTags('Institutional Analytics & Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('executive')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Super Admin: Get executive campus-wide telematics, fees, and attendance' })
  async getExecutive() {
    return this.analyticsService.getAdminExecutiveSummary();
  }

  @Get('department/:code')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOD)
  @ApiOperation({ summary: 'HOD: Get department-specific academic performance & workload metrics' })
  async getDepartmentAnalytics(@Param('code') code: string) {
    return this.analyticsService.getHodDepartmentSummary(code);
  }
}
