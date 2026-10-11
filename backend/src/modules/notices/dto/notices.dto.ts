import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { NoticeCategory } from '@prisma/client';

export class CreateNoticeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: 'One-paragraph summary shown in lists' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  summary: string;

  @ApiPropertyOptional({ description: 'Full notice body' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ enum: NoticeCategory })
  @IsEnum(NoticeCategory)
  category: NoticeCategory;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @ApiPropertyOptional({ description: 'Issuing office; defaults to the publishing user', example: 'Registrar Office' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  authorName?: string;
}
