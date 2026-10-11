import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlacementService } from './placement.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('Training & Placement Cell (TPO)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('placement')
export class PlacementController {
  constructor(private readonly placementService: PlacementService) {}

  @Get('drives')
  @ApiOperation({ summary: 'Get list of active placement drives and eligibility criteria' })
  async findAll() {
    return this.placementService.findAll();
  }

  @Get('applications')
  @ApiOperation({ summary: 'Get student placement applications and interview statuses' })
  async getApplications() {
    return this.placementService.getApplications();
  }

  @Get('drives/:id')
  @ApiOperation({ summary: 'Get drive details, JD, and interview schedule' })
  async findOne(@Param('id') id: string) {
    return this.placementService.findById(id);
  }

  @Post('drives/:id/apply')
  @ApiOperation({ summary: 'Student: Apply to placement drive with eligibility verification' })
  async apply(@Param('id') id: string, @CurrentUser() user: any) {
    return this.placementService.applyToDrive(id, user.studentId);
  }

  @Post('applications/:id/sign-loi')
  @ApiOperation({ summary: 'Student: Digitally accept and sign Letter of Intent (LOI)' })
  async signLoi(@Param('id') id: string, @CurrentUser() user: any) {
    return this.placementService.signLoi(id, user.studentId);
  }
}
