import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { UserRole, AttendanceStatus } from '@prisma/client';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray } from 'class-validator';

class GenerateQrDto {
  @IsString()
  @IsNotEmpty()
  subjectCode: string;

  @IsString()
  @IsNotEmpty()
  section: string;

  @IsNumber()
  period: number;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}

class ScanQrDto {
  @IsString()
  @IsNotEmpty()
  qrToken: string;

  @IsOptional()
  @IsNumber()
  userLat?: number;

  @IsOptional()
  @IsNumber()
  userLng?: number;
}

class VerifyQrMobileDto {
  @IsString()
  @IsNotEmpty()
  payload: string;

  @IsOptional()
  @IsNumber()
  userLat?: number;

  @IsOptional()
  @IsNumber()
  userLng?: number;
}

class BatchAttendanceDto {
  @IsString()
  @IsNotEmpty()
  subjectCode: string;

  @IsString()
  @IsNotEmpty()
  section: string;

  @IsNumber()
  period: number;

  @IsArray()
  records: { studentId: string; status: AttendanceStatus }[];
}

@ApiTags('Attendance & QR Hub')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get current student attendance percentage & subject metrics' })
  async getMySummary(@CurrentUser('studentId') studentId: string) {
    return this.attendanceService.getStudentSummary(studentId);
  }

  @Get('student')
  @ApiOperation({ summary: 'Get subject attendance array for web dashboard' })
  async getStudentSubjectAttendance(@CurrentUser('studentId') studentId: string) {
    return this.attendanceService.getSubjectAttendanceList(studentId);
  }

  @Get('corrections')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOD, UserRole.FACULTY)
  @ApiOperation({ summary: 'Get pending attendance petitions & duty leave corrections' })
  async getCorrections() {
    return this.attendanceService.getAttendanceCorrections();
  }

  @Get('student/:studentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOD, UserRole.FACULTY, UserRole.EXAM_OFFICER)
  @ApiOperation({ summary: 'Get attendance summary for specific student' })
  async getStudentSummary(@Param('studentId') studentId: string) {
    return this.attendanceService.getStudentSummary(studentId);
  }

  @Post('verify-qr')
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mobile QR Verification: Scan classroom QR token' })
  async verifyQrMobile(@CurrentUser('studentId') studentId: string, @Body() dto: VerifyQrMobileDto) {
    return this.attendanceService.scanAndVerifyQr({
      qrToken: dto.payload,
      studentId,
      userLat: dto.userLat,
      userLng: dto.userLng,
    });
  }

  @Post('qr/session')
  @Roles(UserRole.FACULTY, UserRole.HOD, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Faculty: Generate 60-second rotating QR token with classroom geofence' })
  async generateQr(@CurrentUser('facultyId') facultyId: string, @Body() dto: GenerateQrDto) {
    return this.attendanceService.generateQrSession({
      facultyId,
      ...dto,
    });
  }

  @Post('qr/scan')
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Student: Scan classroom QR token with geofence and anti-proxy verification' })
  async scanQr(@CurrentUser('studentId') studentId: string, @Body() dto: ScanQrDto) {
    return this.attendanceService.scanAndVerifyQr({
      qrToken: dto.qrToken,
      studentId,
      userLat: dto.userLat,
      userLng: dto.userLng,
    });
  }

  @Post('batch')
  @Roles(UserRole.FACULTY, UserRole.HOD, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Faculty: Submit roster attendance (Present/Absent/Late)' })
  async submitBatch(@CurrentUser('facultyId') facultyId: string, @Body() dto: BatchAttendanceDto) {
    return this.attendanceService.submitBatchAttendance({ facultyId, ...dto });
  }
}
