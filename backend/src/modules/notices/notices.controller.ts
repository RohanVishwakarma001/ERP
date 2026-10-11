import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NoticesService } from './notices.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators';
import { UserRole } from '@prisma/client';

@ApiTags('Campus Notices & Circulars')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notices')
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of published notices and gazettes' })
  async findAll() {
    return this.noticesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific notice' })
  async findOne(@Param('id') id: string) {
    return this.noticesService.findById(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOD)
  @ApiOperation({ summary: 'Publish new institutional circular' })
  async create(@Body() body: any) {
    return this.noticesService.create(body);
  }
}
