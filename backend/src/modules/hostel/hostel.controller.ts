import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { HostelService } from './hostel.service';
import { CurrentStudentId, Roles } from '../../common/decorators';
import { RoleGroups } from '../../common/constants/role-groups';

@ApiTags('Hostel & Mess Management')
@ApiBearerAuth()
@Controller('hostel')
export class HostelController {
  constructor(private readonly hostelService: HostelService) {}

  @Get()
  @ApiOperation({ summary: 'Hostel buildings with occupancy' })
  findAll() {
    return this.hostelService.findAll();
  }

  @Get('rooms')
  @Roles(...RoleGroups.HOSTEL)
  @ApiOperation({ summary: 'Warden: every bed and its occupant' })
  getRooms() {
    return this.hostelService.getHostelRooms();
  }

  @Get('my-allocation')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Student: own room and bed allotment (404 if none)' })
  getMyAllocation(@CurrentStudentId() studentId: string) {
    return this.hostelService.getMyAllocation(studentId);
  }
}
