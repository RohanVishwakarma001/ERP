import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { AssignmentsService } from './assignments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

class SubmitAssignmentDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_protocol: true })
  fileUrl: string;
}

@ApiTags('Assignments & Lab Submissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of published assignments' })
  async findAll(@CurrentUser('studentId') studentId: string) {
    return this.assignmentsService.findAll(studentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assignment details by ID' })
  async findOne(@Param('id') id: string, @CurrentUser('studentId') studentId: string) {
    return this.assignmentsService.findById(id, studentId);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Student: Submit assignment file (upload it via POST /uploads first, then submit the returned URL here)' })
  async submitAssignment(
    @Param('id') id: string,
    @CurrentUser('studentId') studentId: string,
    @Body() dto: SubmitAssignmentDto,
  ) {
    return this.assignmentsService.submitAssignment(id, studentId, dto.fileUrl);
  }
}
