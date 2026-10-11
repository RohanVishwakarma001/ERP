import { Controller, Get, Post, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PlacementService } from './placement.service';
import { CurrentStudentId, CurrentUser, Roles } from '../../common/decorators';
import { AuthUser } from '../../common/interfaces/auth-user.interface';

@ApiTags('Training & Placement Cell (TPO)')
@ApiBearerAuth()
@Controller('placement')
export class PlacementController {
  constructor(private readonly placementService: PlacementService) {}

  @Get('drives')
  @ApiOperation({ summary: 'Placement drives with real application counts (and your own status, for students)' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.placementService.findAll(user);
  }

  @Get('drives/:id')
  @ApiOperation({ summary: 'Placement drive details' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.placementService.findById(id, user);
  }

  @Get('applications')
  @ApiOperation({ summary: 'Applications (students: own only; staff: all)' })
  getApplications(@CurrentUser() user: AuthUser) {
    return this.placementService.getApplications(user);
  }

  @Post('drives/:id/apply')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Student: apply to a drive (checks deadline, CGPA cut-off and debarment)' })
  apply(@Param('id') id: string, @CurrentStudentId() studentId: string) {
    return this.placementService.applyToDrive(id, studentId);
  }

  @Post('applications/:id/sign-loi')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Student: accept the Letter of Intent on your own offered application' })
  signLoi(@Param('id') id: string, @CurrentStudentId() studentId: string) {
    return this.placementService.signLoi(id, studentId);
  }
}
