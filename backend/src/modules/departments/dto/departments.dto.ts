import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
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

export const DEGREE_TYPES = ['DIPLOMA', 'UNDERGRADUATE', 'POSTGRADUATE', 'DOCTORAL'] as const;

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Computer Science & Engineering' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'CSE', description: '2–10 uppercase letters/digits' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @Matches(/^[A-Z0-9]{2,10}$/, { message: 'code must be 2–10 uppercase letters or digits' })
  code: string;

  @ApiProperty({ example: 'Block A' })
  @IsString()
  @IsNotEmpty()
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

export class CreateProgramDto {
  @ApiProperty({ example: 'B.Tech Computer Science & Engineering' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @ApiProperty({ example: 'BTECH_CSE', description: '2–20 uppercase letters, digits or "_"' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
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

export class CreateSectionDto {
  @ApiProperty({ example: 'CSE-1A' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
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
