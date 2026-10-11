import { Injectable, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CertificateType } from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  private requireDb() {
    if (!this.prisma.isConnected) {
      throw new ServiceUnavailableException('Document records are currently unreachable.');
    }
  }

  async getMyDocuments(userId: string) {
    this.requireDb();
    return this.prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyCertificates(studentId: string) {
    this.requireDb();
    return this.prisma.certificateRequest.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Issues an institutional certificate with a real, unguessable verification
   * code backed by a database record — this is JBIT's own signed-record system,
   * distinct from (and does not require) a DigiLocker/NAD government partner
   * integration, which needs separate institutional API onboarding.
   */
  async requestCertificate(data: { studentId: string; type: CertificateType; purpose: string }) {
    this.requireDb();

    const student = await this.prisma.student.findUnique({ where: { id: data.studentId } });
    if (!student) {
      throw new BadRequestException('Student profile not found for this account.');
    }

    const verificationCode = randomBytes(16).toString('hex');
    const certificateNumber = `JBIT/REG/${new Date().getFullYear()}/${data.type.slice(0, 2)}-${randomBytes(3).toString('hex').toUpperCase()}`;

    const request = await this.prisma.certificateRequest.create({
      data: {
        studentId: data.studentId,
        type: data.type,
        purpose: data.purpose,
        status: 'ISSUED',
        certificateNumber,
        verificationCode,
        issuedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Certificate issued and registered with the institutional ledger.',
      request,
    };
  }

  /**
   * Public QR verification endpoint: looks up a real, previously issued
   * certificate record. Any code that doesn't match a real ISSUED record is
   * reported as invalid — this never fabricates a "verified" result.
   */
  async verifyCertificate(code: string) {
    if (!this.prisma.isConnected) {
      throw new ServiceUnavailableException('Verification records are currently unreachable.');
    }

    const cert = await this.prisma.certificateRequest.findUnique({
      where: { verificationCode: code },
      include: { student: { include: { user: true, program: true } } },
    });

    if (!cert || cert.status !== 'ISSUED') {
      return {
        valid: false,
        message: 'No matching certificate found for this verification code.',
      };
    }

    return {
      valid: true,
      institution: 'JB Institute of Technology, Dehradun',
      affiliatedTo: 'Veer Madho Singh Bhandari Uttarakhand Technical University (UTU)',
      certificateType: cert.type,
      certificateNumber: cert.certificateNumber,
      verificationCode: cert.verificationCode,
      studentName: cert.student.user.name,
      program: cert.student.program.name,
      issuedOn: cert.issuedAt?.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
      issuingAuthority: 'Office of Registrar & Dean Academics',
    };
  }
}
