import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { CertificateStatus, CertificateType } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  getMyDocuments(userId: string) {
    return this.prisma.document.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  getMyCertificates(studentId: string) {
    return this.prisma.certificateRequest.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' } });
  }

  /** A student's request is recorded as PENDING; only the registrar's office can issue it. */
  async requestCertificate(studentId: string, type: CertificateType, purpose: string) {
    const request = await this.prisma.certificateRequest.create({
      data: { studentId, type, purpose: purpose.trim(), status: CertificateStatus.PENDING },
    });
    return { success: true, message: 'Certificate request submitted for approval.', request };
  }

  getPendingCertificateRequests() {
    return this.prisma.certificateRequest.findMany({
      where: { status: CertificateStatus.PENDING },
      include: { student: { select: { rollNumber: true, user: { select: { name: true } } } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Issues a pending request with an unguessable public verification code. This is
   * JBIT's own signed-record system, independent of DigiLocker/NAD integration.
   */
  async issueCertificate(requestId: string) {
    const request = await this.prisma.certificateRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Certificate request not found.');
    if (request.status !== CertificateStatus.PENDING) {
      throw new BadRequestException(`This request is already ${request.status}.`);
    }

    return this.prisma.certificateRequest.update({
      where: { id: requestId },
      data: {
        status: CertificateStatus.ISSUED,
        certificateNumber: `JBIT/REG/${new Date().getFullYear()}/${request.type.slice(0, 2)}-${randomBytes(3).toString('hex').toUpperCase()}`,
        verificationCode: randomBytes(16).toString('hex'),
        issuedAt: new Date(),
      },
    });
  }

  /** Public QR verification. Anything that isn't a real ISSUED record is reported invalid. */
  async verifyCertificate(code: string) {
    const cert = await this.prisma.certificateRequest.findUnique({
      where: { verificationCode: code },
      include: { student: { include: { user: { select: { name: true } }, program: { select: { name: true } } } } },
    });

    if (!cert || cert.status !== CertificateStatus.ISSUED) {
      return { valid: false, message: 'No matching certificate found for this verification code.' };
    }

    return {
      valid: true,
      institution: 'JB Institute of Technology, Dehradun',
      affiliatedTo: 'Veer Madho Singh Bhandari Uttarakhand Technical University (UTU)',
      certificateType: cert.type,
      certificateNumber: cert.certificateNumber,
      studentName: cert.student.user.name,
      program: cert.student.program.name,
      issuedOn: cert.issuedAt?.toISOString().slice(0, 10),
      issuingAuthority: 'Office of Registrar & Dean Academics',
    };
  }
}
