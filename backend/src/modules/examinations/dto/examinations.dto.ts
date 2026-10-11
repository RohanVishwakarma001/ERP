import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
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
