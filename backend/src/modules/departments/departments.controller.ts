import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { Roles } from '../../common/decorators';
import { RoleGroups } from '../../common/constants/role-groups';
import { CreateDepartmentDto, CreateProgramDto, CreateSectionDto } from './dto/departments.dto';

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

  @Get('programs')
  @ApiOperation({ summary: 'List academic programs with their department and enrolment' })
  listPrograms() {
    return this.departmentsService.listPrograms();
  }

  @Post('programs')
  @Roles(...RoleGroups.ADMINS)
  @ApiOperation({ summary: 'Admin: create an academic program under a department' })
  createProgram(@Body() dto: CreateProgramDto) {
    return this.departmentsService.createProgram(dto);
  }

  @Get('sections')
  @ApiOperation({ summary: 'List class sections with enrolment' })
  listSections() {
    return this.departmentsService.listSections();
  }

  @Post('sections')
  @Roles(...RoleGroups.ADMINS)
  @ApiOperation({ summary: 'Admin: create a class section for an academic year' })
  createSection(@Body() dto: CreateSectionDto) {
    return this.departmentsService.createSection(dto);
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
