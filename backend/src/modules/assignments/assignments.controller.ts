import { Controller, Get, Post, Patch, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AssignmentsService } from './assignments.service';
import { CurrentStudentId, CurrentUser, Roles } from '../../common/decorators';
import { RoleGroups } from '../../common/constants/role-groups';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreateAssignmentDto, GradeSubmissionDto, SubmitAssignmentDto } from './dto/assignments.dto';

@ApiTags('Assignments & Lab Submissions')
@ApiBearerAuth()
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get()
  @ApiOperation({ summary: "Assignments in the caller's scope (student: own section; faculty: own)" })
  findAll(@CurrentUser() user: AuthUser) {
    return this.assignmentsService.findAll(user);
  }

  @Post()
  @Roles(...RoleGroups.TEACHING_STAFF)
  @ApiOperation({ summary: 'Faculty: set an assignment for a section, optionally with an attached brief' })
  create(@Body() dto: CreateAssignmentDto, @CurrentUser() user: AuthUser) {
    return this.assignmentsService.create(dto, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Assignment details' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.assignmentsService.findById(id, user);
  }

  @Patch(':id/close')
  @Roles(...RoleGroups.TEACHING_STAFF)
  @ApiOperation({ summary: 'Faculty: stop accepting submissions' })
  close(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.assignmentsService.close(id, user);
  }

  @Get(':id/submissions')
  @Roles(...RoleGroups.TEACHING_STAFF)
  @ApiOperation({ summary: 'Faculty: every student of the section with their submission' })
  submissions(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.assignmentsService.listSubmissions(id, user);
  }

  @Patch(':id/submissions/:studentId')
  @Roles(...RoleGroups.TEACHING_STAFF)
  @ApiOperation({ summary: 'Faculty: award marks and feedback for a submission' })
  grade(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Body() dto: GradeSubmissionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.assignmentsService.grade(id, studentId, dto, user);
  }

  @Post(':id/submit')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Student: submit a file URL (upload via POST /uploads first)' })
  submit(@Param('id', ParseUUIDPipe) id: string, @CurrentStudentId() studentId: string, @Body() dto: SubmitAssignmentDto) {
    return this.assignmentsService.submitAssignment(id, studentId, dto.fileUrl);
  }
}
