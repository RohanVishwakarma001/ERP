import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsUploadedFileUrl } from '../../../common/validators/uploaded-file-url';

export const LEAVE_TYPES = ['CASUAL', 'MEDICAL', 'DUTY', 'OD'] as const;
export const LEAVE_DECISIONS = ['APPROVED', 'REJECTED'] as const;

export class CreateLeaveDto {
  @ApiProperty({ enum: LEAVE_TYPES })
  @IsIn(LEAVE_TYPES)
  leaveType: (typeof LEAVE_TYPES)[number];

  @ApiProperty({ example: '2026-11-03' })
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty({ example: '2026-11-05' })
  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  reason: string;

  @ApiPropertyOptional({ description: 'Supporting document (upload via POST /uploads first)' })
  @IsOptional()
  @IsUploadedFileUrl()
  documentUrl?: string;
}

export class UpdateLeaveStatusDto {
  @ApiProperty({ enum: LEAVE_DECISIONS })
  @IsIn(LEAVE_DECISIONS)
  status: (typeof LEAVE_DECISIONS)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;
}
