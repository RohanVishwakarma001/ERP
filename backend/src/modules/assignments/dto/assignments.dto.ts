import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { IsUploadedFileUrl } from '../../../common/validators/uploaded-file-url';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const trimOrUndefined = ({ value }: { value: unknown }) => (typeof value === 'string' && value.trim() ? value.trim() : undefined);

export class SubmitAssignmentDto {
  @ApiProperty({ description: 'Link returned by POST /uploads' })
  @IsString()
  @IsNotEmpty()
  @IsUploadedFileUrl()
  fileUrl: string;
}

export class CreateAssignmentDto {
  @ApiProperty()
  @IsUUID('4', { message: 'Choose a course.' })
  subjectId: string;

  @ApiProperty()
  @IsUUID('4', { message: 'Choose a section.' })
  sectionId: string;

  @ApiProperty({ example: 'Lab 3: Lexical analyser' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title: string;

  @ApiProperty({ example: 'Implement a lexer for the given grammar and submit the source as a ZIP.' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @ApiProperty({ example: '2026-11-15T23:59:00+05:30' })
  @IsDateString({}, { message: 'Enter a valid deadline.' })
  deadline: string;

  @ApiProperty({ example: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  maxMarks: number;

  @ApiPropertyOptional({ description: 'Question paper / brief uploaded via POST /uploads?folder=assignments' })
  @Transform(trimOrUndefined)
  @IsOptional()
  @IsUploadedFileUrl()
  attachmentUrl?: string;
}

export class GradeSubmissionDto {
  @ApiProperty({ example: 17.5 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  marksObtained: number;

  @ApiPropertyOptional({ example: 'Good structure; handle comments in the lexer.' })
  @Transform(trimOrUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  feedback?: string;
}
