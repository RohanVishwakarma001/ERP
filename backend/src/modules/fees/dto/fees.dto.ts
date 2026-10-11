import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

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
