import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LeaveService } from './leave.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('Leave & Duty Leave Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leave')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of leave applications' })
  async findAll() {
    return this.leaveService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Submit leave or on-duty request' })
  async create(@CurrentUser() user: any, @Body() body: any) {
    return this.leaveService.create({
      userId: user.id,
      userName: user.name,
      role: user.role,
      ...body,
    });
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'HOD / Registrar: Approve or reject leave request' })
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.leaveService.updateStatus(id, body.status);
  }
}
