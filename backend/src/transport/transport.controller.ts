import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TransportService } from './transport.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('Campus Transport & Fleet GPS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transport')
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  @Get('routes')
  @ApiOperation({ summary: 'Get list of operational bus routes and timings' })
  async findAllRoutes() {
    return this.transportService.findAllRoutes();
  }

  @Get('my-pass')
  @ApiOperation({ summary: 'Student: Get digital bus pass and designated stop' })
  async getMyPass(@CurrentUser() user: any) {
    return this.transportService.getMyPass(user.studentId || user.id || 'stu-01');
  }

  @Get('telematics/:routeNumber')
  @ApiOperation({ summary: 'Get live GPS coordinates and ETA for bus route' })
  async getLiveTelematics(@Param('routeNumber') routeNumber: string) {
    return this.transportService.getLiveTelematics(routeNumber);
  }
}
