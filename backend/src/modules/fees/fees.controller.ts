import { Controller, Get, Post, Delete, Body, Param, ParseUUIDPipe, Req, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { SkipThrottle } from '@nestjs/throttler';
import { FeesService } from './fees.service';
import { CurrentStudentId, CurrentUser, Public, Roles } from '../../common/decorators';
import { RoleGroups } from '../../common/constants/role-groups';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { AssignFeeStructureDto, CreateFeeStructureDto, CreateOrderDto, RecordPaymentDto, VerifyPaymentDto } from './dto/fees.dto';

@ApiTags('Fee Ledger & Payment Gateway')
@ApiBearerAuth()
@Controller('fees')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Get()
  @Roles(...RoleGroups.FINANCE)
  @ApiOperation({ summary: 'Finance: institution-wide fee ledger' })
  getFeeLedger() {
    return this.feesService.getFeeLedger();
  }

  @Get('structures')
  @Roles(...RoleGroups.FINANCE)
  @ApiOperation({ summary: 'Finance: fee structures with billed / collected totals' })
  listStructures() {
    return this.feesService.listStructures();
  }

  @Post('structures')
  @Roles(...RoleGroups.FINANCE)
  @ApiOperation({ summary: 'Finance: define the fee for a program semester and academic year' })
  createStructure(@Body() dto: CreateFeeStructureDto) {
    return this.feesService.createStructure(dto);
  }

  @Delete('structures/:id')
  @Roles(...RoleGroups.FINANCE)
  @ApiOperation({ summary: 'Finance: delete a fee structure no student has been billed with' })
  deleteStructure(@Param('id', ParseUUIDPipe) id: string) {
    return this.feesService.deleteStructure(id);
  }

  @Post('structures/:id/assign')
  @Roles(...RoleGroups.FINANCE)
  @ApiOperation({ summary: 'Finance: bill every current student of the program semester (skips those already billed)' })
  assignStructure(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignFeeStructureDto) {
    return this.feesService.assignStructure(id, dto);
  }

  @Post('accounts/:id/payments')
  @Roles(...RoleGroups.FINANCE)
  @ApiOperation({ summary: 'Finance: record a cash / cheque / DD / bank-transfer payment and issue a receipt' })
  recordPayment(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RecordPaymentDto) {
    return this.feesService.recordOfflinePayment(id, dto);
  }

  @Get('me')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Student: fee accounts, pending dues and receipts' })
  getMyFees(@CurrentStudentId() studentId: string) {
    return this.feesService.getMyFees(studentId);
  }

  @Post('orders')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Student: create a Razorpay order against outstanding dues' })
  createOrder(@CurrentStudentId() studentId: string, @Body() dto: CreateOrderDto) {
    return this.feesService.createPaymentOrder(studentId, dto.amount);
  }

  @Post('verify')
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Student: verify the signature returned by Razorpay Checkout' })
  verifyPayment(@CurrentStudentId() studentId: string, @Body() dto: VerifyPaymentDto) {
    return this.feesService.verifyPaymentCallback(studentId, dto);
  }

  @Public()
  @SkipThrottle()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Razorpay webhook for payment reconciliation (HMAC-verified)' })
  handleWebhook(@Req() req: RawBodyRequest<Request>) {
    if (!req.rawBody) throw new BadRequestException('Raw request body unavailable.');
    return this.feesService.verifyPaymentWebhook(req.rawBody, req.headers['x-razorpay-signature'] as string | undefined);
  }

  @Get('receipt/:receiptId')
  @ApiOperation({ summary: 'Fee receipt by id / receipt number (students: own receipts only)' })
  getReceipt(@Param('receiptId') receiptId: string, @CurrentUser() user: AuthUser) {
    return this.feesService.getReceipt(receiptId, user);
  }
}
