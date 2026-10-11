import { Controller, Get, Post, Body, Param, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FeesService } from './fees.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, Public } from '../common/decorators';

class CreateOrderDto {
  @IsNumber()
  @IsPositive()
  amount: number;
}

class VerifyPaymentDto {
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

@ApiTags('Fee Ledger & Payment Gateway')
@Controller('fees')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Get institutional fee ledger items' })
  async getFeeLedger() {
    return this.feesService.getFeeLedger();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Student: Get personal fee breakdown, pending dues, and receipts' })
  async getMyFees(@CurrentUser('studentId') studentId: string) {
    return this.feesService.getMyFees(studentId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('orders')
  @ApiOperation({ summary: 'Initiate a real Razorpay payment order' })
  async createOrder(@CurrentUser('studentId') studentId: string, @Body() dto: CreateOrderDto) {
    return this.feesService.createPaymentOrder(studentId, dto.amount);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('verify')
  @ApiOperation({ summary: 'Verify the payment signature returned by Razorpay Checkout on success' })
  async verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.feesService.verifyPaymentCallback(dto);
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Razorpay async webhook for payment reconciliation (HMAC-verified)' })
  async handleWebhook(@Req() req: RawBodyRequest<Request>) {
    if (!req.rawBody) {
      throw new BadRequestException('Raw request body unavailable.');
    }
    const signature = req.headers['x-razorpay-signature'] as string | undefined;
    return this.feesService.verifyPaymentWebhook(req.rawBody, signature);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('receipt/:receiptId')
  @ApiOperation({ summary: 'Fetch a digitally verified institutional fee receipt' })
  async getReceipt(@Param('receiptId') receiptId: string) {
    return this.feesService.getReceipt(receiptId);
  }
}
