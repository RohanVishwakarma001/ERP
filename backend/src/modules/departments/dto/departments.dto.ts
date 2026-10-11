import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { SubjectType } from '@prisma/client';

export const DEGREE_TYPES = ['DIPLOMA', 'UNDERGRADUATE', 'POSTGRADUATE', 'DOCTORAL'] as const;

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const trimUpper = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toUpperCase() : value);

// ── Departments ──────────────────────────────────────────────────────────────

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Computer Science & Engineering' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'CSE', description: '2–10 uppercase letters/digits' })
  @Transform(trimUpper)
  @Matches(/^[A-Z0-9]{2,10}$/, { message: 'code must be 2–10 uppercase letters or digits' })
  code: string;

  @ApiProperty({ example: 'Block A' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  building: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  nbaAccredited?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetAllocated?: number;
}

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}

// ── Programs ─────────────────────────────────────────────────────────────────

export class CreateProgramDto {
  @ApiProperty({ example: 'B.Tech Computer Science & Engineering' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @ApiProperty({ example: 'BTECH_CSE', description: '2–20 uppercase letters, digits or "_"' })
  @Transform(trimUpper)
  @Matches(/^[A-Z0-9_]{2,20}$/, { message: 'code must be 2–20 uppercase letters, digits or "_"' })
  code: string;

  @ApiProperty()
  @IsUUID('4', { message: 'Choose a department.' })
  departmentId: string;

  @ApiProperty({ example: 4 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(6)
  durationYears: number;

  @ApiProperty({ example: 8 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  totalSemesters: number;

  @ApiProperty({ enum: DEGREE_TYPES })
  @IsIn(DEGREE_TYPES)
  degreeType: (typeof DEGREE_TYPES)[number];
}

/** A program stays in its department; move it by creating a new one. */
export class UpdateProgramDto extends PartialType(OmitType(CreateProgramDto, ['departmentId'] as const)) {}

// ── Sections ─────────────────────────────────────────────────────────────────

export class CreateSectionDto {
  @ApiProperty({ example: 'CSE-1A' })
  @Transform(trimUpper)
  @Matches(/^[A-Z0-9][A-Z0-9 _-]{0,29}$/, { message: 'name must be up to 30 letters, digits, spaces, "-" or "_"' })
  name: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  semester: number;

  @ApiProperty({ example: '2026-2027' })
  @Matches(/^\d{4}-\d{4}$/, { message: 'academicYear must look like 2026-2027' })
  academicYear: string;

  @ApiProperty({ example: 60 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  capacity: number;
}

export class UpdateSectionDto extends PartialType(CreateSectionDto) {}

// ── Courses (subjects) ───────────────────────────────────────────────────────

export class CreateSubjectDto {
  @ApiProperty({ example: 'CS-601', description: 'Unique course code' })
  @Transform(trimUpper)
  @Matches(/^[A-Z0-9][A-Z0-9 _-]{1,19}$/, { message: 'code must be 2–20 letters, digits, spaces, "-" or "_"' })
  code: string;

  @ApiProperty({ example: 'Compiler Design' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @ApiProperty({ example: 4 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  credits: number;

  @ApiProperty({ example: 6 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  semester: number;

  @ApiProperty({ enum: SubjectType })
  @IsEnum(SubjectType)
  type: SubjectType;

  @ApiProperty({ description: 'Program the course belongs to (sets the department)' })
  @IsUUID('4', { message: 'Choose a program.' })
  programId: string;
}

/** A course stays in its program; create a new one to move it. */
export class UpdateSubjectDto extends PartialType(OmitType(CreateSubjectDto, ['programId'] as const)) {}
