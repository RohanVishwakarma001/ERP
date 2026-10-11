import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export const COMPLAINT_CATEGORIES = ['ACADEMIC', 'HOSTEL', 'TRANSPORT', 'INFRASTRUCTURE', 'FINANCE', 'RAGGING'] as const;
export const COMPLAINT_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

export class CreateComplaintDto {
  @ApiProperty({ enum: COMPLAINT_CATEGORIES })
  @IsIn(COMPLAINT_CATEGORIES)
  category: (typeof COMPLAINT_CATEGORIES)[number];

  @ApiPropertyOptional({ enum: COMPLAINT_PRIORITIES, default: 'MEDIUM' })
  @IsOptional()
  @IsIn(COMPLAINT_PRIORITIES)
  priority?: (typeof COMPLAINT_PRIORITIES)[number];

  @ApiProperty({ example: 'Projector not working in LH-302' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;
}

export class AddCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  text: string;
}
