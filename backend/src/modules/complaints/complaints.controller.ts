import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ComplaintsService } from './complaints.service';
import { CurrentStudentId, CurrentUser, Roles } from '../../common/decorators';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { AddCommentDto, CreateComplaintDto } from './dto/complaints.dto';

@ApiTags('Grievance & Redressal Ticketing')
@ApiBearerAuth()
@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Get()
  @ApiOperation({ summary: 'Complaints (students: own only; staff: all)' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.complaintsService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Complaint with comment timeline' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.complaintsService.findById(id, user);
  }

  @Post()
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Student: raise a grievance ticket' })
  create(@CurrentStudentId() studentId: string, @Body() dto: CreateComplaintDto) {
    return this.complaintsService.create(studentId, dto);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a progress comment (students: own tickets only)' })
  addComment(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: AddCommentDto) {
    return this.complaintsService.addComment(id, user, dto.text);
  }
}
