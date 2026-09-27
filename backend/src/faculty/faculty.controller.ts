import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FacultyService } from './faculty.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('Faculty Academic Hub')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('faculty')
export class FacultyController {
  constructor(private readonly facultyService: FacultyService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of faculty members' })
  async findAll() {
    return this.facultyService.findAll();
  }

  @Get('classes/today')
  @ApiOperation({ summary: 'Get today classes for logged-in faculty member' })
  async getTodayClasses(@CurrentUser() user: any) {
    return this.facultyService.getTodayClasses(user.facultyId || 'fac-01');
  }

  @Get('me')
  @ApiOperation({ summary: 'Get profile of logged-in faculty member' })
  async getMe(@CurrentUser() user: any) {
    return this.facultyService.findById(user.facultyId || 'fac-01');
  }

  @Get('me/workload')
  @ApiOperation({ summary: 'Get 18-hour AICTE teaching load & classes for logged-in faculty' })
  async getMyWorkload(@CurrentUser() user: any) {
    return this.facultyService.getWorkload(user.facultyId || 'fac-01');
  }

  @Post('classes/:id/generate-qr')
  @ApiOperation({ summary: 'Generate rotating QR code for specific class' })
  async generateClassQr(@Param('id') classId: string) {
    return {
      qrCode: `JBIT-SECURE-QR-${classId}-${Date.now()}`,
      expiresInSeconds: 60,
    };
  }

  @Post('classes/:id/attendance')
  @ApiOperation({ summary: 'Submit roster attendance for specific class' })
  async submitClassAttendance(
    @Param('id') classId: string,
    @Body('records') records: any[],
  ) {
    return {
      success: true,
      classId,
      count: records?.length || 0,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific faculty profile' })
  async findOne(@Param('id') id: string) {
    return this.facultyService.findById(id);
  }
}
