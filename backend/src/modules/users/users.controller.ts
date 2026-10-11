import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser, Roles } from '../../common/decorators';
import { RoleGroups } from '../../common/constants/role-groups';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { UsersService } from './users.service';
import { CreateUserDto, ListUsersQueryDto, UpdateUserStatusDto } from './dto/users.dto';

@ApiTags('User Accounts')
@ApiBearerAuth()
@Controller('users')
@Roles(...RoleGroups.ADMINS)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: list accounts, filterable by role and free-text search' })
  findAll(@Query() query: ListUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Post()
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOperation({ summary: 'Admin: create a student, faculty, HOD or staff account with its profile' })
  create(@Body() dto: CreateUserDto, @CurrentUser() actor: AuthUser) {
    return this.usersService.create(dto, actor);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Admin: activate, deactivate or suspend an account' })
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserStatusDto, @CurrentUser() actor: AuthUser) {
    return this.usersService.updateStatus(id, dto, actor);
  }
}
