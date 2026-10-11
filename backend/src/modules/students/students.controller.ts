import { Controller, Get, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { StudentsService } from './students.service';
import { CurrentStudentId, Roles } from '../../common/decorators';
import { RoleGroups } from '../../common/constants/role-groups';
import { ListStudentsQueryDto, UpdateDebarmentDto } from './dto/students.dto';

@ApiTags('Students & Debarment Management')
@ApiBearerAuth()
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @Roles(...RoleGroups.ROSTER_VIEWERS)
  @ApiOperation({ summary: 'List students, filterable by semester, section, debarment and free-text search' })
  findAll(@Query() query: ListStudentsQueryDto) {
    return this.studentsService.findAll(query);
  }

  @Get('me')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Student: own academic profile' })
  getMe(@CurrentStudentId() studentId: string) {
    return this.studentsService.findById(studentId);
  }

  @Get(':id')
  @Roles(...RoleGroups.ROSTER_VIEWERS)
  @ApiOperation({ summary: 'Student dossier by id, roll number, enrollment number or email' })
  findOne(@Param('id') id: string) {
    return this.studentsService.findById(id);
  }

  @Get(':id/debarment-status')
  @Roles(...RoleGroups.ROSTER_VIEWERS)
  @ApiOperation({ summary: 'UTU Ordinance 14(B) 75% attendance compliance for a student' })
  getDebarmentStatus(@Param('id') id: string) {
    return this.studentsService.getDebarmentStatus(id);
  }

  @Patch(':id/debarment')
  @Roles(...RoleGroups.EXAM_CONTROL)
  @ApiOperation({ summary: 'Debar a student or approve condonation (also withholds / releases the hall ticket)' })
  updateDebarment(@Param('id') id: string, @Body() dto: UpdateDebarmentDto) {
    return this.studentsService.updateDebarmentStatus(id, dto.status);
  }
}
