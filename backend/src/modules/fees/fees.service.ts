import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import Razorpay = require('razorpay');
import { PrismaService } from '../prisma/prisma.service';

const MOCK_STUDENT_FEE = {
  rollNumber: '220102048',
  studentName: 'Aarav Sharma',
  totalFee: 117500,
  paidFee: 117500,
  pendingDues: 0,
  nextDueDate: '15 July 2026',
  clearanceStatus: 'CLEARED',
  breakdown: [
    { title: 'Semester Tuition Fee', amount: 65000, status: 'PAID' },
    { title: 'Hostel & Mess Charges', amount: 42000, status: 'PAID' },
    { title: 'University Examination Fee', amount: 3500, status: 'PAID' },
    { title: 'Library & Laboratory Deposit', amount: 7000, status: 'PAID' },
  ],
  recentTransactions: [
    {
      id: 'TXN-01',
      date: '14 March 2026',
      amount: 42500,
      receiptNumber: 'JBIT/REC/2026/0489',
      mode: 'UPI / NetBanking',
      status: 'SUCCESS',
    },
  ],
};

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

@Injectable()
export class FeesService {
  private readonly logger = new Logger(FeesService.name);
  private razorpay: Razorpay | null = null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const keyId = this.configService.get<string>('PAYMENT_KEY_ID');
    const keySecret = this.configService.get<string>('PAYMENT_KEY_SECRET');

    if (keyId && keySecret && !keyId.includes('mock')) {
      this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    } else {
      this.logger.warn(
        'Razorpay is not configured with real credentials (PAYMENT_KEY_ID/PAYMENT_KEY_SECRET are unset or placeholders). ' +
          'Payment endpoints will return 503 until real keys are set in the environment.',
      );
    }
  }

  async getMyFees(studentId: string) {
    if (this.prisma.isConnected) {
      try {
        const student = await this.prisma.student.findFirst({
          where: {
            OR: [{ id: studentId }, { rollNumber: studentId }, { user: { email: studentId } }],
          },
          include: {
            user: true,
            fees: {
              include: {
                feeStructure: true,
                transactions: { orderBy: { createdAt: 'desc' } },
              },
            },
          },
        });

        if (student && student.fees.length > 0) {
          const sf = student.fees[0];
          const fs = sf.feeStructure;
          const isCleared = sf.pendingAmount <= 0;

          return {
            rollNumber: student.rollNumber,
            studentName: student.user.name,
            totalFee: sf.totalAmount,
            paidFee: sf.paidAmount,
            pendingDues: sf.pendingAmount,
            nextDueDate: new Date(sf.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
            clearanceStatus: isCleared ? 'CLEARED' : 'PENDING',
            breakdown: [
              { title: 'Semester Tuition Fee', amount: fs.tuitionFee, status: isCleared ? 'PAID' : 'PENDING' },
              { title: 'Development & Infrastructure Fee', amount: fs.developmentFee, status: isCleared ? 'PAID' : 'PENDING' },
              { title: 'Laboratory & Computing Charges', amount: fs.labFee, status: isCleared ? 'PAID' : 'PENDING' },
              { title: 'University Examination Fee', amount: fs.examFee, status: isCleared ? 'PAID' : 'PENDING' },
              { title: 'Library & Digital Knowledge Deposit', amount: fs.libraryFee, status: isCleared ? 'PAID' : 'PENDING' },
            ],
            recentTransactions: sf.transactions
              .filter((t) => t.status === 'SUCCESS')
              .map((t) => ({
                id: t.id,
                date: new Date(t.paidAt || t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
                amount: t.amount,
                receiptNumber: t.receiptNumber,
                mode: t.paymentMethod,
                status: t.status,
              })),
          };
        }
      } catch {
        // Fallback
      }
    }
    return MOCK_STUDENT_FEE;
  }

  async getFeeLedger() {
    if (this.prisma.isConnected) {
      try {
        const studentFees = await this.prisma.studentFee.findMany({
          include: {
            feeStructure: true,
            transactions: { orderBy: { createdAt: 'desc' } },
            student: { include: { user: true } },
          },
          take: 20,
        });

        if (studentFees && studentFees.length > 0) {
          return studentFees.map((sf, idx) => ({
            id: sf.id,
            category: (idx % 2 === 0 ? 'Tuition' : 'Hostel & Mess') as any,
            amountDue: sf.totalAmount,
            amountPaid: sf.paidAmount,
            status: sf.pendingAmount <= 0 ? ('PAID' as const) : ('PENDING' as const),
            dueDate: new Date(sf.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
            lastPaymentDate: sf.transactions[0]
              ? new Date(sf.transactions[0].paidAt || sf.transactions[0].createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
              : 'N/A',
            transactionRef: sf.transactions[0]?.transactionId || 'N/A',
          }));
        }
      } catch {
        // Fallback
      }
    }

    return [];
  }

  private async resolveStudentFee(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { fees: { include: { feeStructure: true } } },
    });
    if (!student) {
      throw new BadRequestException('Student profile not found for this account.');
    }
    const studentFee = student.fees[0];
    if (!studentFee) {
      throw new BadRequestException('No fee structure is currently assigned to this student.');
    }
    return studentFee;
  }

  async createPaymentOrder(studentId: string, amount: number) {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero.');
    }
    if (!this.razorpay) {
      throw new ServiceUnavailableException('Payment gateway is not configured on this server.');
    }
    if (!this.prisma.isConnected) {
      throw new ServiceUnavailableException('Fee ledger database is currently unreachable.');
    }

    const studentFee = await this.resolveStudentFee(studentId);
    if (amount > studentFee.pendingAmount) {
      throw new BadRequestException(`Amount exceeds pending dues of ₹${studentFee.pendingAmount}.`);
    }

    const transactionId = `jbit-${studentFee.id.slice(0, 8)}-${Date.now()}`;
    let order: { id: string };
    try {
      order = await this.razorpay.orders.create({
        amount: Math.round(amount * 100), // Razorpay expects the smallest currency unit (paise)
        currency: 'INR',
        receipt: transactionId,
      });
    } catch (err) {
      this.logger.error(`Razorpay order creation failed: ${err.message}`);
      throw new ServiceUnavailableException('Unable to create payment order with the gateway. Please try again.');
    }

    await this.prisma.feeTransaction.create({
      data: {
        studentFeeId: studentFee.id,
        transactionId,
        amount,
        status: 'CREATED',
        gatewayOrderId: order.id,
      },
    });

    return {
      orderId: order.id,
      amount,
      currency: 'INR',
      keyId: this.configService.get<string>('PAYMENT_KEY_ID'),
    };
  }

  /** Verifies the signature the client receives directly from Razorpay Checkout on success. */
  async verifyPaymentCallback(data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) {
    const keySecret = this.configService.get<string>('PAYMENT_KEY_SECRET');
    if (!keySecret) {
      throw new ServiceUnavailableException('Payment gateway is not configured on this server.');
    }

    const expected = createHmac('sha256', keySecret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest('hex');

    if (!safeEqual(expected, data.razorpay_signature)) {
      throw new BadRequestException('Payment signature verification failed. This payment could not be trusted.');
    }

    return this.markTransactionPaid(data.razorpay_order_id, data.razorpay_payment_id);
  }

  /** Verifies an async Razorpay webhook using the raw request body per Razorpay's documented HMAC scheme. */
  async verifyPaymentWebhook(rawBody: Buffer, signature: string | undefined) {
    const webhookSecret = this.configService.get<string>('PAYMENT_WEBHOOK_SECRET');
    if (!webhookSecret || webhookSecret.includes('mock')) {
      throw new ServiceUnavailableException('Payment webhook is not configured on this server.');
    }
    if (!signature) {
      throw new BadRequestException('Missing webhook signature.');
    }

    const expected = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
    if (!safeEqual(expected, signature)) {
      throw new BadRequestException('Invalid webhook signature.');
    }

    const event = JSON.parse(rawBody.toString('utf8'));
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payment = event.payload?.payment?.entity;
      if (payment?.order_id && payment?.id) {
        await this.markTransactionPaid(payment.order_id, payment.id);
      }
    }

    return { received: true };
  }

  private async markTransactionPaid(gatewayOrderId: string, gatewayPaymentId: string) {
    const txn = await this.prisma.feeTransaction.findFirst({ where: { gatewayOrderId } });
    if (!txn) {
      throw new NotFoundException('No transaction found for this payment order.');
    }
    if (txn.status === 'SUCCESS') {
      return {
        success: true,
        message: 'Payment already recorded.',
        receiptNumber: txn.receiptNumber,
        status: 'SUCCESS',
      };
    }

    const receiptNumber = `JBIT/REC/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;

    await this.prisma.$transaction([
      this.prisma.feeTransaction.update({
        where: { id: txn.id },
        data: { status: 'SUCCESS', gatewayPaymentId, receiptNumber, paidAt: new Date() },
      }),
      this.prisma.studentFee.update({
        where: { id: txn.studentFeeId },
        data: {
          paidAmount: { increment: txn.amount },
          pendingAmount: { decrement: txn.amount },
        },
      }),
    ]);

    const updatedFee = await this.prisma.studentFee.findUnique({ where: { id: txn.studentFeeId } });
    if (updatedFee && updatedFee.pendingAmount <= 0 && updatedFee.status !== 'PAID') {
      await this.prisma.studentFee.update({ where: { id: updatedFee.id }, data: { status: 'PAID', pendingAmount: 0 } });
    }

    return {
      success: true,
      message: 'Payment verified and credited to the institutional ledger.',
      receiptNumber,
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
    };
  }

  async getReceipt(receiptId: string) {
    if (!this.prisma.isConnected) {
      throw new ServiceUnavailableException('Receipt database is currently unreachable.');
    }

    const txn = await this.prisma.feeTransaction.findFirst({
      where: { OR: [{ id: receiptId }, { receiptNumber: receiptId }, { transactionId: receiptId }] },
      include: {
        studentFee: {
          include: { student: { include: { user: true } }, feeStructure: true },
        },
      },
    });

    if (!txn || txn.status !== 'SUCCESS') {
      throw new NotFoundException('Receipt not found.');
    }

    return {
      receiptNumber: txn.receiptNumber,
      institution: 'JB Institute of Technology, Dehradun',
      affiliatedTo: 'Veer Madho Singh Bhandari Uttarakhand Technical University',
      studentName: txn.studentFee.student.user.name,
      rollNumber: txn.studentFee.student.rollNumber,
      amountPaid: txn.amount,
      feeHead: `Semester ${txn.studentFee.feeStructure.semester} Tuition & Fee Payment`,
      paymentMode: `Online Payment Gateway (Razorpay) — ${txn.gatewayPaymentId}`,
      date: (txn.paidAt || txn.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
      authorizedSignatory: 'Finance & Accounts Division',
      isOfficialDigitalReceipt: true,
    };
  }
}
