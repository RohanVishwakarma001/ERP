import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

const trimOrUndefined = ({ value }: { value: unknown }) => (typeof value === 'string' && value.trim() ? value.trim() : undefined);

export class ListAdmitCardsQueryDto {
  @ApiProperty()
  @IsUUID('4', { message: 'Choose an exam.' })
  examId: string;
}

export class ApproveAdmitCardsDto {
  @ApiProperty()
  @IsUUID('4', { message: 'Choose an exam.' })
  examId: string;

  @ApiProperty({ type: [String], description: 'Students to approve (max 500 per request)' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Select at least one student.' })
  @ArrayMaxSize(500)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  studentIds: string[];

  @ApiPropertyOptional({
    description:
      'Approve even when fees are outstanding or the student is debarred. Required reason, recorded on the admit card (e.g. "Instalment plan approved by Registrar").',
  })
  @Transform(trimOrUndefined)
  @IsOptional()
  @IsString()
  @MinLength(5, { message: 'Give a reason of at least 5 characters for approving despite the checks.' })
  @MaxLength(300)
  overrideReason?: string;
}

export class RevokeAdmitCardDto {
  @ApiProperty({ example: 'Fee cheque bounced' })
  @Transform(trimOrUndefined)
  @IsString()
  @IsNotEmpty({ message: 'Give a reason for revoking.' })
  @MaxLength(300)
  reason: string;
}
