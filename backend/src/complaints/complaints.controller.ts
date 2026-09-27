import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ComplaintsService } from './complaints.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('Grievance & Redressal Ticketing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of complaints and grievances' })
  async findAll() {
    return this.complaintsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get complaint ticket details with comments timeline' })
  async findOne(@Param('id') id: string) {
    return this.complaintsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new grievance ticket' })
  async create(@CurrentUser() user: any, @Body() body: any) {
    return this.complaintsService.create({
      studentId: user.studentId,
      studentName: user.name,
      ...body,
    });
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add progress comment or resolution note' })
  async addComment(
    @Param('id') id: string,
    @CurrentUser('name') authorName: string,
    @Body('text') text: string,
  ) {
    return this.complaintsService.addComment(id, authorName || 'Support Agent', text);
  }
}
