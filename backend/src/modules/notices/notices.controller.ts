import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NoticesService } from './notices.service';
import { CurrentUser, Roles } from '../../common/decorators';
import { RoleGroups } from '../../common/constants/role-groups';
import { CreateNoticeDto } from './dto/notices.dto';

@ApiTags('Campus Notices & Circulars')
@ApiBearerAuth()
@Controller('notices')
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Get()
  @ApiOperation({ summary: 'Published notices, urgent first' })
  findAll() {
    return this.noticesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Notice with full content' })
  findOne(@Param('id') id: string) {
    return this.noticesService.findById(id);
  }

  @Post()
  @Roles(...RoleGroups.ACADEMIC_LEADERSHIP)
  @ApiOperation({ summary: 'Publish a notice' })
  create(@Body() dto: CreateNoticeDto, @CurrentUser('name') publisherName: string) {
    return this.noticesService.create(dto, publisherName);
  }
}
