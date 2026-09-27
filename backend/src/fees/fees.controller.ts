import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FeesService } from './fees.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, Public } from '../common/decorators';

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
  async getMyFees(@CurrentUser() user: any) {
    return this.feesService.getMyFees(user.studentId || user.id || 'stu-01');
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('orders')
  @ApiOperation({ summary: 'Initiate payment order with payment gateway' })
  async createOrder(@CurrentUser() user: any, @Body() body: { amount: number }) {
    return this.feesService.createPaymentOrder(user.studentId || user.id || 'stu-01', body.amount);
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Payment gateway webhook for asynchronous payment reconciliation' })
  async handleWebhook(@Body() payload: any) {
    return this.feesService.verifyPaymentWebhook(payload);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('receipt/:receiptId')
  @ApiOperation({ summary: 'Download digitally verified institutional fee receipt' })
  async getReceipt(@Param('receiptId') receiptId: string) {
    return this.feesService.getReceipt(receiptId);
  }
}
