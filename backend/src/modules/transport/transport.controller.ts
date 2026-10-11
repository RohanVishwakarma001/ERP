import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { TransportService } from './transport.service';
import { CurrentStudentId, Roles } from '../../common/decorators';

@ApiTags('Campus Transport & Fleet GPS')
@ApiBearerAuth()
@Controller('transport')
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  @Get('routes')
  @ApiOperation({ summary: 'Bus routes with live GPS position when available' })
  findAllRoutes() {
    return this.transportService.findAllRoutes();
  }

  @Get('my-pass')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Student: own bus pass (404 if none)' })
  getMyPass(@CurrentStudentId() studentId: string) {
    return this.transportService.getMyPass(studentId);
  }

  @Get('telematics/:routeNumber')
  @ApiOperation({ summary: 'Live GPS position for a route (null position when no fresh fix)' })
  getLiveTelematics(@Param('routeNumber') routeNumber: string) {
    return this.transportService.getLiveTelematics(routeNumber);
  }
}
