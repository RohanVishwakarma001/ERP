import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { UserRole } from '@prisma/client';
import { AssignmentsService } from './assignments.service';
import { CurrentStudentId, CurrentUser, Roles } from '../../common/decorators';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { IsUploadedFileUrl } from '../../common/validators/uploaded-file-url';

class SubmitAssignmentDto {
  @IsString()
  @IsNotEmpty()
  @IsUploadedFileUrl()
  fileUrl: string;
}

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

  @Get(':id')
  @ApiOperation({ summary: 'Assignment details' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.assignmentsService.findById(id, user);
  }

  @Post(':id/submit')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Student: submit a file URL (upload via POST /uploads first)' })
  submit(@Param('id') id: string, @CurrentStudentId() studentId: string, @Body() dto: SubmitAssignmentDto) {
    return this.assignmentsService.submitAssignment(id, studentId, dto.fileUrl);
  }
}
