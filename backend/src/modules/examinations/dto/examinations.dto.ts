import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsUUID,
  Matches,
  MaxLength,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { AssessmentType } from '@prisma/client';

export class GenerateSeatingDto {
  @ApiProperty({ description: 'ExamSchedule id (one paper on one date)' })
  @IsString()
  @IsNotEmpty()
  scheduleId: string;

  @ApiProperty({ description: 'Room id to seat candidates in' })
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @ApiPropertyOptional({ default: 6, description: 'Desks per row' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(26)
  columns?: number;
}

export class MarkEntryDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsNumber()
  @Min(0)
  marksObtained: number;

  @IsOptional()
  @IsBoolean()
  isAbsent?: boolean;
}

export class RecordMarksDto {
  @ApiProperty({ example: 'CS-601' })
  @IsString()
  @IsNotEmpty()
  subjectCode: string;

  @ApiPropertyOptional({ example: 'CSE-6A', description: 'Section the assessment was held for' })
  @IsOptional()
  @IsString()
  section?: string;

  @ApiProperty({ enum: AssessmentType })
  @IsEnum(AssessmentType)
  assessmentType: AssessmentType;

  @ApiProperty({ example: 30 })
  @IsInt()
  @Min(1)
  @Max(200)
  maxMarks: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MarkEntryDto)
  records: MarkEntryDto[];
}

const CLOCK_TIME = /^(0?[1-9]|1[0-2]):[0-5]\d (AM|PM)$/;
export const EXAM_STATUSES = ['SCHEDULED', 'ONGOING', 'COMPLETED'] as const;

export class CreateExamDto {
  @ApiProperty({ example: 'End-Semester Examinations, Odd Semester 2026' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title: string;

  @ApiProperty({ example: 'ODD_2026', description: 'Short code for the cycle' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @Matches(/^[A-Z0-9_-]{2,30}$/, { message: 'cycle must be 2–30 letters, digits, "-" or "_"' })
  cycle: string;

  @ApiProperty({ example: '2026-2027' })
  @Matches(/^\d{4}-\d{4}$/, { message: 'academicYear must look like 2026-2027' })
  academicYear: string;
}

export class UpdateExamStatusDto {
  @ApiProperty({ enum: EXAM_STATUSES })
  @IsIn(EXAM_STATUSES)
  status: (typeof EXAM_STATUSES)[number];
}

export class AddExamPaperDto {
  @ApiProperty()
  @IsUUID('4', { message: 'Choose a course.' })
  subjectId: string;

  @ApiProperty({ example: '2026-11-24' })
  @IsDateString({ strict: true }, { message: 'Enter a valid exam date.' })
  date: string;

  @ApiProperty({ example: '09:30 AM' })
  @Matches(CLOCK_TIME, { message: 'startTime must look like 09:30 AM' })
  startTime: string;

  @ApiProperty({ example: '12:30 PM' })
  @Matches(CLOCK_TIME, { message: 'endTime must look like 12:30 PM' })
  endTime: string;

  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  maxMarks: number;
}
