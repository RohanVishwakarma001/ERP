import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { UserRole } from '@prisma/client';

@ApiTags('Students & Debarment Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOD, UserRole.FACULTY, UserRole.EXAM_OFFICER)
  @ApiOperation({ summary: 'Get list of students with filters for debarment, semester, department' })
  @ApiQuery({ name: 'semester', required: false })
  @ApiQuery({ name: 'isDebarred', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(@Query() query: any) {
    return this.studentsService.findAll(query);
  }

  @Get('me')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get profile of current logged-in student' })
  async getMe(@CurrentUser() user: any) {
    return this.studentsService.findById(user.studentId || user.id || 'stu-01');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific student academic dossier' })
  async findOne(@Param('id') id: string) {
    return this.studentsService.findById(id);
  }

  @Patch(':id/debarment')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOD, UserRole.EXAM_OFFICER)
  @ApiOperation({ summary: 'Update student debarment status (ELIGIBLE/CONDONATION/DEBARRED)' })
  async updateDebarment(@Param('id') id: string, @Body('status') status: string) {
    return this.studentsService.updateDebarmentStatus(id, status);
  }

  @Post(':id/toggle-hall-ticket')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOD, UserRole.EXAM_OFFICER)
  @ApiOperation({ summary: 'Toggle hall ticket release status between RELEASED and WITHHELD' })
  async toggleHallTicket(@Param('id') id: string) {
    return this.studentsService.toggleHallTicket(id);
  }

  @Get(':id/debarment-status')
  @ApiOperation({ summary: 'Check UTU Ordinance 14(B) 75% attendance debarment compliance' })
  async getDebarmentStatus(@Param('id') id: string) {
    return this.studentsService.getDebarmentStatus(id);
  }
}
