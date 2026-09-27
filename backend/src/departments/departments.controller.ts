import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Departments & Academic Programs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of institutional departments and accreditation data' })
  async findAll() {
    return this.departmentsService.findAll();
  }

  @Get('curriculum')
  @ApiOperation({ summary: 'Get current curriculum list and syllabus delivery percentages' })
  async getCurriculum() {
    return this.departmentsService.getCurriculum();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific department info' })
  async findOne(@Param('id') id: string) {
    return this.departmentsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new department' })
  async create(@Body() body: any) {
    return this.departmentsService.create(body);
  }
}
