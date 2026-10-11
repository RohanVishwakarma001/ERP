import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ExaminationsService } from './examinations.service';
import { CurrentStudentId, Roles } from '../../common/decorators';
import { RoleGroups } from '../../common/constants/role-groups';
import { AddExamPaperDto, CreateExamDto, GenerateSeatingDto, RecordMarksDto, UpdateExamStatusDto } from './dto/examinations.dto';

@ApiTags('Examinations & Seating Matrix')
@ApiBearerAuth()
@Controller('exams')
export class ExaminationsController {
  constructor(private readonly examsService: ExaminationsService) {}

  @Get('schedule')
  @ApiOperation({ summary: 'Examination timetable (papers, dates, rooms)' })
  getSchedule() {
    return this.examsService.getSchedule();
  }

  @Get('cycles')
  @ApiOperation({ summary: 'Examination cycles with date range and hall counts' })
  getCycles() {
    return this.examsService.getCycles();
  }

  @Post()
  @Roles(...RoleGroups.EXAM_CONTROL)
  @ApiOperation({ summary: 'COE: create an exam cycle' })
  createExam(@Body() dto: CreateExamDto) {
    return this.examsService.createExam(dto);
  }

  @Patch(':id/status')
  @Roles(...RoleGroups.EXAM_CONTROL)
  @ApiOperation({ summary: 'COE: mark an exam scheduled, ongoing or completed' })
  updateExamStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateExamStatusDto) {
    return this.examsService.updateExamStatus(id, dto);
  }

  @Delete(':id')
  @Roles(...RoleGroups.EXAM_CONTROL)
  @ApiOperation({ summary: 'COE: delete an exam with no admit cards or hall allocations' })
  deleteExam(@Param('id', ParseUUIDPipe) id: string) {
    return this.examsService.deleteExam(id);
  }

  @Post(':id/papers')
  @Roles(...RoleGroups.EXAM_CONTROL)
  @ApiOperation({ summary: 'COE: schedule a paper (course, date, time) in an exam' })
  addPaper(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddExamPaperDto) {
    return this.examsService.addPaper(id, dto);
  }

  @Delete('papers/:scheduleId')
  @Roles(...RoleGroups.EXAM_CONTROL)
  @ApiOperation({ summary: 'COE: remove a paper that has no seating yet' })
  removePaper(@Param('scheduleId', ParseUUIDPipe) scheduleId: string) {
    return this.examsService.removePaper(scheduleId);
  }

  @Get('seating')
  @Roles(...RoleGroups.EXAM_CONTROL, UserRole.FACULTY)
  @ApiOperation({ summary: 'Hall allocations with candidate counts and invigilators' })
  getSeating() {
    return this.examsService.getSeatingHalls();
  }

  @Post('seating-matrix/generate')
  @Roles(...RoleGroups.EXAM_CONTROL)
  @ApiOperation({ summary: 'COE: seat eligible candidates for a paper into a room, interleaving departments' })
  generateSeating(@Body() dto: GenerateSeatingDto) {
    return this.examsService.generateSeatingMatrix(dto);
  }

  @Post('marks')
  @Roles(...RoleGroups.TEACHING_STAFF, UserRole.EXAM_OFFICER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Faculty/COE: record marks for one assessment of a subject' })
  recordMarks(@Body() dto: RecordMarksDto) {
    return this.examsService.recordMarks(dto);
  }

  @Get('grade-card')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Student: own grade card with SGPA/CGPA' })
  getMyGradeCard(@CurrentStudentId() studentId: string) {
    return this.examsService.getStudentGradeCard(studentId);
  }

  @Get('grades/:studentId')
  @Roles(...RoleGroups.EXAM_CONTROL, UserRole.FACULTY)
  @ApiOperation({ summary: 'Grade card for a specific student' })
  getGradeCard(@Param('studentId') studentId: string) {
    return this.examsService.getStudentGradeCard(studentId);
  }
}
