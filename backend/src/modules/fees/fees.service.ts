import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import Razorpay = require('razorpay');
import { FeeStatus, PaymentStatus, UserRole } from '@prisma/client';
import { AppConfig, PaymentConfig } from '../../config';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { VerifyPaymentDto } from './dto/fees.dto';

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);

function feeStatusFor(pending: number, dueDate: Date): FeeStatus {
  if (pending <= 0) return FeeStatus.PAID;
  return dueDate < new Date() ? FeeStatus.OVERDUE : FeeStatus.PENDING;
}

@Injectable()
export class FeesService {
  private readonly logger = new Logger(FeesService.name);
  private readonly payment: PaymentConfig | null;
  private readonly razorpay: Razorpay | null = null;

  constructor(
    private prisma: PrismaService,
    config: AppConfig,
  ) {
    this.payment = config.payment;
    if (this.payment) {
      this.razorpay = new Razorpay({ key_id: this.payment.keyId, key_secret: this.payment.keySecret });
    } else {
      this.logger.warn('Razorpay is not configured (PAYMENT_KEY_ID / PAYMENT_KEY_SECRET). Payment endpoints will return 503.');
    }
  }

  private requirePaymentGateway(): { razorpay: Razorpay; payment: PaymentConfig } {
    if (!this.razorpay || !this.payment) {
      throw new ServiceUnavailableException('Payment gateway is not configured on this server.');
    }
    return { razorpay: this.razorpay, payment: this.payment };
  }

  /** The student's fee accounts (one per fee structure), totals, and successful payments. */
  async getMyFees(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { name: true } },
        fees: {
          include: { feeStructure: true, transactions: { where: { status: PaymentStatus.SUCCESS }, orderBy: { paidAt: 'desc' } } },
          orderBy: { dueDate: 'asc' },
        },
      },
    });
    if (!student) throw new NotFoundException('Student profile not found.');

    const totalFee = student.fees.reduce((sum, f) => sum + f.totalAmount, 0);
    const paidFee = student.fees.reduce((sum, f) => sum + f.paidAmount, 0);
    const pendingDues = student.fees.reduce((sum, f) => sum + f.pendingAmount, 0);
    const nextDue = student.fees.find((f) => f.pendingAmount > 0);

    return {
      rollNumber: student.rollNumber,
      studentName: student.user.name,
      totalFee,
      paidFee,
      pendingDues,
      nextDueDate: nextDue ? toIsoDate(nextDue.dueDate) : null,
      clearanceStatus: pendingDues <= 0 ? 'CLEARED' : 'PENDING',
      accounts: student.fees.map((f) => ({
        id: f.id,
        semester: f.feeStructure.semester,
        academicYear: f.feeStructure.academicYear,
        totalAmount: f.totalAmount,
        paidAmount: f.paidAmount,
        pendingAmount: f.pendingAmount,
        dueDate: toIsoDate(f.dueDate),
        status: feeStatusFor(f.pendingAmount, f.dueDate),
        breakdown: [
          { title: 'Tuition Fee', amount: f.feeStructure.tuitionFee },
          { title: 'Development Fee', amount: f.feeStructure.developmentFee },
          { title: 'Laboratory Fee', amount: f.feeStructure.labFee },
          { title: 'Examination Fee', amount: f.feeStructure.examFee },
          { title: 'Library Fee', amount: f.feeStructure.libraryFee },
        ].filter((line) => line.amount > 0),
      })),
      recentTransactions: student.fees
        .flatMap((f) => f.transactions)
        .sort((a, b) => (b.paidAt?.getTime() ?? 0) - (a.paidAt?.getTime() ?? 0))
        .map((t) => ({
          id: t.id,
          date: toIsoDate(t.paidAt ?? t.createdAt),
          amount: t.amount,
          receiptNumber: t.receiptNumber,
          mode: t.paymentMethod,
          status: t.status,
        })),
    };
  }

  /** Institution-wide ledger: one row per student fee account. */
  async getFeeLedger() {
    const accounts = await this.prisma.studentFee.findMany({
      include: {
        feeStructure: { select: { semester: true, academicYear: true } },
        student: { select: { rollNumber: true, user: { select: { name: true } } } },
        transactions: { where: { status: PaymentStatus.SUCCESS }, orderBy: { paidAt: 'desc' }, take: 1 },
      },
      orderBy: { dueDate: 'asc' },
    });

    return accounts.map((a) => ({
      id: a.id,
      studentName: a.student.user.name,
      rollNumber: a.student.rollNumber,
      semester: a.feeStructure.semester,
      academicYear: a.feeStructure.academicYear,
      amountDue: a.totalAmount,
      amountPaid: a.paidAmount,
      amountPending: a.pendingAmount,
      status: feeStatusFor(a.pendingAmount, a.dueDate),
      dueDate: toIsoDate(a.dueDate),
      lastPaymentDate: a.transactions[0]?.paidAt ? toIsoDate(a.transactions[0].paidAt) : null,
      transactionRef: a.transactions[0]?.transactionId ?? null,
    }));
  }

  /** The earliest-due account with an outstanding balance is the one a payment is applied to. */
  private async findPayableAccount(studentId: string) {
    const account = await this.prisma.studentFee.findFirst({
      where: { studentId, pendingAmount: { gt: 0 } },
      orderBy: { dueDate: 'asc' },
    });
    if (!account) throw new BadRequestException('There are no outstanding dues on this account.');
    return account;
  }

  async createPaymentOrder(studentId: string, amount: number) {
    const { razorpay, payment } = this.requirePaymentGateway();
    const account = await this.findPayableAccount(studentId);
    if (amount > account.pendingAmount) {
      throw new BadRequestException(`Amount exceeds pending dues of ₹${account.pendingAmount}.`);
    }

    const transactionId = `jbit-${account.id.slice(0, 8)}-${Date.now()}`;
    let order: { id: string };
    try {
      order = await razorpay.orders.create({
        amount: Math.round(amount * 100), // Razorpay expects paise
        currency: 'INR',
        receipt: transactionId,
      });
    } catch (err) {
      this.logger.error(`Razorpay order creation failed: ${(err as Error).message}`);
      throw new ServiceUnavailableException('Unable to create a payment order with the gateway. Please try again.');
    }

    await this.prisma.feeTransaction.create({
      data: { studentFeeId: account.id, transactionId, amount, status: PaymentStatus.CREATED, gatewayOrderId: order.id },
    });

    return { orderId: order.id, amount, currency: 'INR', keyId: payment.keyId };
  }

  /** Verifies the signature the client receives from Razorpay Checkout on success. */
  async verifyPaymentCallback(studentId: string, dto: VerifyPaymentDto) {
    const { payment } = this.requirePaymentGateway();
    const owned = await this.prisma.feeTransaction.findFirst({
      where: { gatewayOrderId: dto.razorpay_order_id, studentFee: { studentId } },
      select: { id: true },
    });
    if (!owned) throw new NotFoundException('No transaction found for this payment order.');

    const expected = createHmac('sha256', payment.keySecret)
      .update(`${dto.razorpay_order_id}|${dto.razorpay_payment_id}`)
      .digest('hex');

    if (!safeEqual(expected, dto.razorpay_signature)) {
      throw new BadRequestException('Payment signature verification failed. This payment could not be trusted.');
    }
    return this.markTransactionPaid(dto.razorpay_order_id, dto.razorpay_payment_id);
  }

  /** Verifies an async Razorpay webhook (HMAC over the raw body). */
  async verifyPaymentWebhook(rawBody: Buffer, signature: string | undefined) {
    const webhookSecret = this.payment?.webhookSecret;
    if (!webhookSecret) throw new ServiceUnavailableException('Payment webhook is not configured on this server.');
    if (!signature) throw new BadRequestException('Missing webhook signature.');

    const expected = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
    if (!safeEqual(expected, signature)) throw new BadRequestException('Invalid webhook signature.');

    let event: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };
    try {
      event = JSON.parse(rawBody.toString('utf8'));
    } catch {
      throw new BadRequestException('Malformed webhook payload.');
    }

    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const entity = event.payload?.payment?.entity;
      if (entity?.order_id && entity.id) await this.markTransactionPaid(entity.order_id, entity.id);
    }
    return { received: true };
  }

  /**
   * Idempotent: the checkout callback and the webhook both land here, possibly
   * concurrently. The conditional updateMany guarantees the ledger is credited once.
   */
  private async markTransactionPaid(gatewayOrderId: string, gatewayPaymentId: string) {
    const txn = await this.prisma.feeTransaction.findFirst({ where: { gatewayOrderId } });
    if (!txn) throw new NotFoundException('No transaction found for this payment order.');

    const receiptNumber = `JBIT/REC/${new Date().getFullYear()}/${txn.id.slice(0, 8).toUpperCase()}`;

    const credited = await this.prisma.$transaction(async (tx) => {
      const claim = await tx.feeTransaction.updateMany({
        where: { id: txn.id, status: { not: PaymentStatus.SUCCESS } },
        data: { status: PaymentStatus.SUCCESS, gatewayPaymentId, receiptNumber, paidAt: new Date() },
      });
      if (claim.count === 0) return false; // already processed

      const account = await tx.studentFee.update({
        where: { id: txn.studentFeeId },
        data: { paidAmount: { increment: txn.amount }, pendingAmount: { decrement: txn.amount } },
      });
      const pending = Math.max(0, account.pendingAmount);
      await tx.studentFee.update({
        where: { id: account.id },
        data: { pendingAmount: pending, status: pending <= 0 ? FeeStatus.PAID : FeeStatus.PARTIAL },
      });
      return true;
    });

    const final = await this.prisma.feeTransaction.findUniqueOrThrow({ where: { id: txn.id } });
    return {
      success: true,
      message: credited ? 'Payment verified and credited to the ledger.' : 'Payment already recorded.',
      receiptNumber: final.receiptNumber,
      status: final.status,
    };
  }

  /** Students may only read their own receipts; finance staff may read any. */
  async getReceipt(receiptId: string, user: AuthUser) {
    const txn = await this.prisma.feeTransaction.findFirst({
      where: {
        status: PaymentStatus.SUCCESS,
        OR: [{ id: receiptId }, { receiptNumber: receiptId }, { transactionId: receiptId }],
      },
      include: { studentFee: { include: { student: { include: { user: true } }, feeStructure: true } } },
    });
    if (!txn) throw new NotFoundException('Receipt not found.');
    if (user.role === UserRole.STUDENT && txn.studentFee.studentId !== user.studentId) {
      throw new ForbiddenException('You can only view your own receipts.');
    }

    return {
      receiptNumber: txn.receiptNumber,
      institution: 'JB Institute of Technology, Dehradun',
      affiliatedTo: 'Veer Madho Singh Bhandari Uttarakhand Technical University',
      studentName: txn.studentFee.student.user.name,
      rollNumber: txn.studentFee.student.rollNumber,
      amountPaid: txn.amount,
      feeHead: `Semester ${txn.studentFee.feeStructure.semester} fees (${txn.studentFee.feeStructure.academicYear})`,
      paymentMode: txn.paymentMethod,
      gatewayPaymentId: txn.gatewayPaymentId,
      date: toIsoDate(txn.paidAt ?? txn.createdAt),
    };
  }
}
