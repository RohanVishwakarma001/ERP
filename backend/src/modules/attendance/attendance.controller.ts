import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AttendanceService } from './attendance.service';
import { CurrentFacultyId, CurrentStudentId, Roles } from '../../common/decorators';
import { RoleGroups } from '../../common/constants/role-groups';
import { BatchAttendanceDto, CreatePetitionDto, GenerateQrDto, ScanQrDto, VerifyQrMobileDto } from './dto/attendance.dto';

@ApiTags('Attendance & QR Hub')
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('summary')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Student: overall attendance percentage & per-subject metrics' })
  getMySummary(@CurrentStudentId() studentId: string) {
    return this.attendanceService.getStudentSummary(studentId);
  }

  @Get('student')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Student: per-subject attendance list (web dashboard shape)' })
  getMySubjectAttendance(@CurrentStudentId() studentId: string) {
    return this.attendanceService.getSubjectAttendanceList(studentId);
  }

  @Get('petitions/me')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Student: own attendance-correction petitions' })
  getMyPetitions(@CurrentStudentId() studentId: string) {
    return this.attendanceService.getMyPetitions(studentId);
  }

  @Post('petitions')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Student: petition to correct a missed class (duty leave / medical)' })
  createPetition(@CurrentStudentId() studentId: string, @Body() dto: CreatePetitionDto) {
    return this.attendanceService.createPetition(studentId, dto);
  }

  @Get('corrections')
  @Roles(...RoleGroups.TEACHING_STAFF)
  @ApiOperation({ summary: 'Pending attendance-correction petitions (duty leave / medical)' })
  getCorrections() {
    return this.attendanceService.getAttendanceCorrections();
  }

  @Get('student/:studentId')
  @Roles(...RoleGroups.TEACHING_STAFF, UserRole.EXAM_OFFICER)
  @ApiOperation({ summary: 'Attendance summary for a specific student (id, roll number or email)' })
  getStudentSummary(@Param('studentId') studentId: string) {
    return this.attendanceService.getStudentSummary(studentId);
  }

  @Post('verify-qr')
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Student (mobile): scan classroom QR token' })
  verifyQrMobile(@CurrentStudentId() studentId: string, @Body() dto: VerifyQrMobileDto) {
    return this.attendanceService.scanAndVerifyQr({ qrToken: dto.payload, studentId, userLat: dto.userLat, userLng: dto.userLng });
  }

  @Post('qr/scan')
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Student (web): scan classroom QR token with geofence verification' })
  scanQr(@CurrentStudentId() studentId: string, @Body() dto: ScanQrDto) {
    return this.attendanceService.scanAndVerifyQr({ qrToken: dto.qrToken, studentId, userLat: dto.userLat, userLng: dto.userLng });
  }

  @Post('qr/session')
  @Roles(...RoleGroups.TEACHING_STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Faculty: generate a 60-second rotating QR token with classroom geofence' })
  generateQr(@CurrentFacultyId() facultyId: string, @Body() dto: GenerateQrDto) {
    return this.attendanceService.generateQrSession(facultyId, dto);
  }

  @Post('batch')
  @Roles(...RoleGroups.TEACHING_STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Faculty: submit roster attendance (PRESENT / ABSENT / LATE / EXCUSED)' })
  submitBatch(@CurrentFacultyId() facultyId: string, @Body() dto: BatchAttendanceDto) {
    return this.attendanceService.submitBatchAttendance(facultyId, dto);
  }
}
