import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

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
