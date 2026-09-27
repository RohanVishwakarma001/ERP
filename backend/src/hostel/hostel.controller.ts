import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HostelService } from './hostel.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('Hostel & Mess Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('hostel')
export class HostelController {
  constructor(private readonly hostelService: HostelService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of hostel buildings, occupancy, and warden contacts' })
  async findAll() {
    return this.hostelService.findAll();
  }

  @Get('rooms')
  @ApiOperation({ summary: 'Get list of hostel bed allocations and occupancy' })
  async getRooms() {
    return this.hostelService.getHostelRooms();
  }

  @Get('my-allocation')
  @ApiOperation({ summary: 'Student: Get room and bed allotment details' })
  async getMyAllocation(@CurrentUser() user: any) {
    return this.hostelService.getMyAllocation(user.studentId || user.id || 'stu-01');
  }

  @Post('outpass')
  @ApiOperation({ summary: 'Student: Apply for digital hostel outpass' })
  async requestOutpass(@CurrentUser() user: any, @Body() body: any) {
    return this.hostelService.requestOutpass({
      studentId: user.studentId || user.id || 'stu-01',
      ...body,
    });
  }
}
