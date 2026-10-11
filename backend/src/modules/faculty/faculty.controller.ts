import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FacultyService } from './faculty.service';
import { CurrentFacultyId, Roles } from '../../common/decorators';
import { RoleGroups } from '../../common/constants/role-groups';

/**
 * QR generation and roster submission live in the attendance module
 * (POST /attendance/qr/session, POST /attendance/batch) — they persist real
 * sessions and records.
 */
@ApiTags('Faculty Academic Hub')
@ApiBearerAuth()
@Controller('faculty')
export class FacultyController {
  constructor(private readonly facultyService: FacultyService) {}

  @Get()
  @ApiOperation({ summary: 'List faculty with workload and assigned subjects' })
  findAll() {
    return this.facultyService.findAll();
  }

  @Get('classes/today')
  @Roles(...RoleGroups.TEACHING_STAFF)
  @ApiOperation({ summary: "Faculty: today's classes with live status and attendance progress" })
  getTodayClasses(@CurrentFacultyId() facultyId: string) {
    return this.facultyService.getTodayClasses(facultyId);
  }

  @Get('me')
  @Roles(...RoleGroups.TEACHING_STAFF)
  @ApiOperation({ summary: 'Faculty: own profile' })
  getMe(@CurrentFacultyId() facultyId: string) {
    return this.facultyService.findById(facultyId);
  }

  @Get('me/workload')
  @Roles(...RoleGroups.TEACHING_STAFF)
  @ApiOperation({ summary: 'Faculty: weekly contact hours vs AICTE requirement' })
  getMyWorkload(@CurrentFacultyId() facultyId: string) {
    return this.facultyService.getWorkload(facultyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Faculty profile by id or employee code' })
  findOne(@Param('id') id: string) {
    return this.facultyService.findById(id);
  }
}
