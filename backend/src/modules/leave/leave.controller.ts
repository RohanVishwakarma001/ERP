import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LeaveService } from './leave.service';
import { CurrentUser, Roles } from '../../common/decorators';
import { RoleGroups } from '../../common/constants/role-groups';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreateLeaveDto, UpdateLeaveStatusDto } from './dto/leave.dto';

@ApiTags('Leave & Duty Leave Requests')
@ApiBearerAuth()
@Controller('leave')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Get()
  @ApiOperation({ summary: 'Leave requests (approvers: all; others: own)' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.leaveService.findAll(user);
  }

  @Post()
  @ApiOperation({ summary: 'Apply for leave / on-duty' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateLeaveDto) {
    return this.leaveService.create(user, dto);
  }

  @Patch(':id/status')
  @Roles(...RoleGroups.ACADEMIC_LEADERSHIP)
  @ApiOperation({ summary: 'HOD / Admin: approve or reject a pending request' })
  updateStatus(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateLeaveStatusDto) {
    return this.leaveService.updateStatus(id, user, dto);
  }
}
