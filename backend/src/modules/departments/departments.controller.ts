import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CurrentUser, Roles } from '../../common/decorators';
import { RoleGroups } from '../../common/constants/role-groups';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import {
  CreateDepartmentDto,
  CreateProgramDto,
  CreateSectionDto,
  CreateSubjectDto,
  UpdateDepartmentDto,
  UpdateProgramDto,
  UpdateSectionDto,
  UpdateSubjectDto,
} from './dto/departments.dto';

/**
 * Academic structure. Anyone signed in can read it. Admins manage everything;
 * HODs manage programs and courses of their own department (enforced in the service).
 * Static routes are declared before `:id` so they aren't captured by it.
 */
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

  @Post()
  @Roles(...RoleGroups.ADMINS)
  @ApiOperation({ summary: 'Admin: create a department' })
  create(@Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(dto);
  }

  // ── Courses ───────────────────────────────────────────────────────────────
  @Get('curriculum')
  @ApiOperation({ summary: 'List courses (subjects) across all departments' })
  getCurriculum() {
    return this.departmentsService.getCurriculum();
  }

  @Post('subjects')
  @Roles(...RoleGroups.ACADEMIC_LEADERSHIP)
  @ApiOperation({ summary: 'Admin / own-department HOD: add a course to a program' })
  createSubject(@Body() dto: CreateSubjectDto, @CurrentUser() actor: AuthUser) {
    return this.departmentsService.createSubject(dto, actor);
  }

  @Patch('subjects/:id')
  @Roles(...RoleGroups.ACADEMIC_LEADERSHIP)
  @ApiOperation({ summary: 'Admin / own-department HOD: edit a course' })
  updateSubject(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSubjectDto, @CurrentUser() actor: AuthUser) {
    return this.departmentsService.updateSubject(id, dto, actor);
  }

  @Delete('subjects/:id')
  @Roles(...RoleGroups.ACADEMIC_LEADERSHIP)
  @ApiOperation({ summary: 'Admin / own-department HOD: delete an unused course' })
  removeSubject(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: AuthUser) {
    return this.departmentsService.removeSubject(id, actor);
  }

  // ── Programs ──────────────────────────────────────────────────────────────
  @Get('programs')
  @ApiOperation({ summary: 'List academic programs with their department and enrolment' })
  listPrograms() {
    return this.departmentsService.listPrograms();
  }

  @Post('programs')
  @Roles(...RoleGroups.ACADEMIC_LEADERSHIP)
  @ApiOperation({ summary: 'Admin / own-department HOD: create a program' })
  createProgram(@Body() dto: CreateProgramDto, @CurrentUser() actor: AuthUser) {
    return this.departmentsService.createProgram(dto, actor);
  }

  @Patch('programs/:id')
  @Roles(...RoleGroups.ACADEMIC_LEADERSHIP)
  @ApiOperation({ summary: 'Admin / own-department HOD: edit a program' })
  updateProgram(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProgramDto, @CurrentUser() actor: AuthUser) {
    return this.departmentsService.updateProgram(id, dto, actor);
  }

  @Delete('programs/:id')
  @Roles(...RoleGroups.ACADEMIC_LEADERSHIP)
  @ApiOperation({ summary: 'Admin / own-department HOD: delete a program with no students or courses' })
  removeProgram(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: AuthUser) {
    return this.departmentsService.removeProgram(id, actor);
  }

  // ── Sections ──────────────────────────────────────────────────────────────
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

  @Patch('sections/:id')
  @Roles(...RoleGroups.ADMINS)
  @ApiOperation({ summary: 'Admin: edit a section' })
  updateSection(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSectionDto) {
    return this.departmentsService.updateSection(id, dto);
  }

  @Delete('sections/:id')
  @Roles(...RoleGroups.ADMINS)
  @ApiOperation({ summary: 'Admin: delete an empty section' })
  removeSection(@Param('id', ParseUUIDPipe) id: string) {
    return this.departmentsService.removeSection(id);
  }

  // ── Single department (keep last) ─────────────────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Department by id or code' })
  findOne(@Param('id') id: string) {
    return this.departmentsService.findById(id);
  }

  @Patch(':id')
  @Roles(...RoleGroups.ADMINS)
  @ApiOperation({ summary: 'Admin: edit a department' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDepartmentDto) {
    return this.departmentsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(...RoleGroups.ADMINS)
  @ApiOperation({ summary: 'Admin: delete a department with no programs, courses, faculty or students' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.departmentsService.remove(id);
  }
}
