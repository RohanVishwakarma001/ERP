import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TimetableService } from './timetable.service';
import { CurrentUser, Roles } from '../../common/decorators';
import { RoleGroups } from '../../common/constants/role-groups';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CheckConflictDto, TimetableQueryDto } from './dto/timetable.dto';

@ApiTags('Timetable Engine')
@ApiBearerAuth()
@Controller('timetable')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Get()
  @ApiOperation({ summary: 'Timetable slots, filterable by day, section and faculty' })
  findAll(@Query() query: TimetableQueryDto) {
    return this.timetableService.findAll(query);
  }

  @Get('my')
  @ApiOperation({ summary: "Caller's weekly timetable (student: own section; faculty: own classes)" })
  getMySchedule(@CurrentUser() user: AuthUser) {
    return this.timetableService.getMySchedule(user);
  }

  @Get('today')
  @ApiOperation({ summary: "Caller's slots for today with live status, in campus time" })
  getToday(@CurrentUser() user: AuthUser) {
    return this.timetableService.getToday(user);
  }

  @Post('check-conflict')
  @Roles(...RoleGroups.ACADEMIC_LEADERSHIP)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check room, faculty and section availability for a slot (409 on clash)' })
  checkConflict(@Body() dto: CheckConflictDto) {
    return this.timetableService.checkConflicts(dto);
  }
}
