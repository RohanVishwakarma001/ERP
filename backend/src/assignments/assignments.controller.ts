import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AssignmentsService } from './assignments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('Assignments & Lab Submissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of published assignments' })
  async findAll() {
    return this.assignmentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assignment details by ID' })
  async findOne(@Param('id') id: string) {
    return this.assignmentsService.findById(id);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Student: Submit assignment PDF before deadline' })
  async submitAssignment(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { fileUrl: string },
  ) {
    return this.assignmentsService.submitAssignment(
      id,
      user.studentId || user.id || 'stu-01',
      body.fileUrl || 'https://storage.jbitdoon.edu.in/submissions/assignment-3.pdf',
    );
  }
}
