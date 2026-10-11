import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListStudentsQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  semester?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  isDebarred?: boolean;

  @ApiPropertyOptional({ description: 'Section name, e.g. CSE-6A' })
  @IsOptional()
  @IsString()
  section?: string;

  @ApiPropertyOptional({ description: 'Matches name, roll number or enrollment number' })
  @IsOptional()
  @IsString()
  search?: string;
}

export const DEBARMENT_STATUSES = ['ELIGIBLE', 'DEBARRED'] as const;
export type DebarmentDecision = (typeof DEBARMENT_STATUSES)[number];

export class UpdateDebarmentDto {
  @ApiProperty({ enum: DEBARMENT_STATUSES })
  @IsIn(DEBARMENT_STATUSES)
  status: DebarmentDecision;
}
