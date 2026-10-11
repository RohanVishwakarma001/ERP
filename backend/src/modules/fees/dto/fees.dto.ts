import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Matches, Max, MaxLength, Min } from 'class-validator';

export class CreateOrderDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;
}

/** Field names match what Razorpay Checkout returns to the client. */
export class VerifyPaymentDto {
  @IsString()
  @IsNotEmpty()
  razorpay_order_id: string;

  @IsString()
  @IsNotEmpty()
  razorpay_payment_id: string;

  @IsString()
  @IsNotEmpty()
  razorpay_signature: string;
}

const money = () => [Type(() => Number), IsNumber({ maxDecimalPlaces: 2 }), Min(0), Max(10_000_000)];
function Money(): PropertyDecorator {
  return (target, key) => money().forEach((d) => d(target, key));
}

export class CreateFeeStructureDto {
  @ApiProperty()
  @IsUUID('4', { message: 'Choose a program.' })
  programId: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  semester: number;

  @ApiProperty({ example: '2026-2027' })
  @Matches(/^\d{4}-\d{4}$/, { message: 'academicYear must look like 2026-2027' })
  academicYear: string;

  @ApiProperty({ example: 55000 })
  @Money()
  tuitionFee: number;

  @ApiPropertyOptional() @IsOptional() @Money() developmentFee?: number;
  @ApiPropertyOptional() @IsOptional() @Money() labFee?: number;
  @ApiPropertyOptional() @IsOptional() @Money() libraryFee?: number;
  @ApiPropertyOptional() @IsOptional() @Money() examFee?: number;
}

export class AssignFeeStructureDto {
  @ApiProperty({ example: '2026-11-30', description: 'Payment due date for every student billed' })
  @IsDateString({ strict: true }, { message: 'Enter a valid due date.' })
  dueDate: string;
}

export const OFFLINE_PAYMENT_MODES = ['CASH', 'CHEQUE', 'DEMAND_DRAFT', 'BANK_TRANSFER', 'UPI'] as const;

export class RecordPaymentDto {
  @ApiProperty({ example: 25000 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiProperty({ enum: OFFLINE_PAYMENT_MODES })
  @IsIn(OFFLINE_PAYMENT_MODES, { message: 'Choose a payment mode.' })
  mode: (typeof OFFLINE_PAYMENT_MODES)[number];

  @ApiPropertyOptional({ description: 'Cheque / DD / UTR / UPI reference' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() ? value.trim() : undefined))
  @IsOptional()
  @IsString()
  @MaxLength(60)
  reference?: string;
}
