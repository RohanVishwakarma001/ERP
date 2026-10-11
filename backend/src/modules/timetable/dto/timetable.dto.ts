import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { DAY_CODES, DayCode } from '../../../common/utils/campus-clock';

const toDayCode = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().slice(0, 3).toUpperCase() : value;

export class TimetableQueryDto {
  @ApiPropertyOptional({ enum: DAY_CODES, description: 'Day code or full name (MON / Monday)' })
  @IsOptional()
  @Transform(toDayCode)
  @IsIn(DAY_CODES)
  day?: DayCode;

  @ApiPropertyOptional({ example: 'CSE-6A' })
  @IsOptional()
  @IsString()
  section?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  facultyId?: string;
}

export class CheckConflictDto {
  @Transform(toDayCode)
  @IsIn(DAY_CODES)
  dayOfWeek: DayCode;

  @IsInt()
  @Min(1)
  @Max(10)
  period: number;

  @IsString()
  @IsNotEmpty()
  facultyId: string;

  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  sectionId: string;
}
