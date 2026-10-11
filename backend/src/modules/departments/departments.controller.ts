import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { Roles } from '../../common/decorators';
import { RoleGroups } from '../../common/constants/role-groups';
import { CreateDepartmentDto } from './dto/departments.dto';

@ApiTags('Departments & Academic Programs')
@ApiBearerAuth()
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List departments with headcounts, HOD, accreditation and budget' })
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get('curriculum')
  @ApiOperation({ summary: 'List subjects across all departments' })
  getCurriculum() {
    return this.departmentsService.getCurriculum();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Department by id or code' })
  findOne(@Param('id') id: string) {
    return this.departmentsService.findById(id);
  }

  @Post()
  @Roles(...RoleGroups.ADMINS)
  @ApiOperation({ summary: 'Admin: create a department' })
  create(@Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(dto);
  }
}
