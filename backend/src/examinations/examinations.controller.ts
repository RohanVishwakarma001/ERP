import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ExaminationsService } from './examinations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('Examinations & Seating Matrix')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exams')
export class ExaminationsController {
  constructor(private readonly examsService: ExaminationsService) {}

  @Get('schedule')
  @ApiOperation({ summary: 'Get UTU examination schedule' })
  async getSchedule() {
    return this.examsService.getSchedule();
  }

  @Get('cycles')
  @ApiOperation({ summary: 'Get institutional examination cycles' })
  async getCycles() {
    return this.examsService.getCycles();
  }

  @Get('seating')
  @ApiOperation({ summary: 'Get examination seating hall allocations' })
  async getSeating() {
    return this.examsService.getSeatingHalls();
  }

  @Get('grade-card')
  @ApiOperation({ summary: 'Student: Get academic grade card with SGPA/CGPA' })
  async getGradeCardWeb(@CurrentUser() user: any) {
    return this.examsService.getStudentGradeCard(user.studentId || user.id || 'stu-01');
  }

  @Post('seating-matrix/generate')
  @ApiOperation({ summary: 'COE: Generate anti-cheating randomized seating arrangement' })
  async generateSeating(@Body() body: any) {
    return this.examsService.generateSeatingMatrix(body);
  }

  @Get('grades/me')
  @ApiOperation({ summary: 'Student: Get semester grade card with SGPA and DigiLocker status' })
  async getMyGradeCard(@CurrentUser() user: any) {
    return this.examsService.getStudentGradeCard(user.studentId || user.id || 'stu-01');
  }

  @Get('grades/:studentId')
  @ApiOperation({ summary: 'Get semester grade card for specific student' })
  async getGradeCard(@Param('studentId') studentId: string) {
    return this.examsService.getStudentGradeCard(studentId);
  }

  @Post('marks/lock')
  @ApiOperation({ summary: 'Faculty/COE: Lock internal and practical marks to UTU node' })
  async lockMarks(@Body() body: any) {
    return this.examsService.lockMarks(body);
  }

  @Post('lock-marks')
  @ApiOperation({ summary: 'Faculty/COE: Cryptographically lock marks to UTU node' })
  async lockMarksAlias(@Body() body: any) {
    return this.examsService.lockMarks(body);
  }
}
