import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TimetableService } from './timetable.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('Timetable Engine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('timetable')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Get()
  @ApiOperation({ summary: 'Get timetable slots with filters for day, section, and faculty' })
  async findAll(@Query() query: any) {
    return this.timetableService.findAll(query);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get timetable personalized for logged-in student or faculty' })
  async getMySchedule(@CurrentUser() user: any) {
    return this.timetableService.getMySchedule(user.role, user.id);
  }

  @Post('lock')
  @ApiOperation({ summary: 'Lock timetable matrix and synchronize with UTU state' })
  async lockTimetable() {
    return this.timetableService.lockAndPublish();
  }

  @Get('today')
  @ApiOperation({ summary: 'Get current day schedule slots for mobile/web' })
  async getToday() {
    return this.timetableService.getTodayStudentSchedule();
  }

  @Post('check-conflict')
  @ApiOperation({ summary: 'Verify room, faculty, and section availability before booking slot' })
  async checkConflict(@Body() body: any) {
    return this.timetableService.checkConflicts(body);
  }
}
