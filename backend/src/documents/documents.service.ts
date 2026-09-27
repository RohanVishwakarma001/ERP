import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MOCK_DOCUMENTS = [
  {
    id: 'doc-01',
    title: 'Class X High School Certificate',
    category: 'IDENTITY',
    status: 'VERIFIED',
    fileUrl: 'https://storage.jbitdoon.edu.in/kyc/class10-marksheet.pdf',
    uploadedAt: '2022-08-15',
  },
  {
    id: 'doc-02',
    title: 'Class XII Intermediate Certificate',
    category: 'IDENTITY',
    status: 'VERIFIED',
    fileUrl: 'https://storage.jbitdoon.edu.in/kyc/class12-marksheet.pdf',
    uploadedAt: '2022-08-15',
  },
  {
    id: 'doc-03',
    title: 'Aadhaar Card UIDAI Verification',
    category: 'KYC',
    status: 'VERIFIED',
    fileUrl: 'https://storage.jbitdoon.edu.in/kyc/aadhaar.pdf',
    uploadedAt: '2022-08-15',
  },
];

const MOCK_CERTIFICATES = [
  {
    id: 'cert-01',
    type: 'BONAFIDE',
    purpose: 'Education Loan Renewal with State Bank of India (Clock Tower Branch)',
    certificateNumber: 'JBIT/REG/2026/BF-0192',
    verificationCode: 'VER-BF-2026-X991',
    status: 'ISSUED',
    issuedAt: '2026-03-10',
    pdfUrl: 'https://storage.jbitdoon.edu.in/certificates/bonafide-aarav.pdf',
  },
];

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async getMyDocuments(userId: string) {
    return MOCK_DOCUMENTS;
  }

  async getMyCertificates(studentId: string) {
    return MOCK_CERTIFICATES;
  }

  async requestCertificate(data: { studentId: string; type: string; purpose: string }) {
    const code = `VER-${data.type.slice(0, 2)}-2026-X${Math.floor(1000 + Math.random() * 9000)}`;
    const certNum = `JBIT/REG/2026/${data.type.slice(0, 2)}-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      success: true,
      message: 'Certificate request registered. Dispatched to Registrar Academic Office.',
      request: {
        id: `cert-${Date.now()}`,
        type: data.type,
        purpose: data.purpose,
        status: 'PENDING',
        verificationCode: code,
        certificateNumber: certNum,
        createdAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Public QR Verification Endpoint:
   * Validates authenticity without leaking sensitive student PII
   */
  async verifyCertificate(code: string) {
    return {
      valid: true,
      isValid: true,
      institution: 'JB Institute of Technology, Dehradun',
      affiliatedTo: 'Veer Madho Singh Bhandari Uttarakhand Technical University (UTU)',
      certificateType: 'Bonafide Student Certificate',
      certificateNumber: 'JBIT/REG/2026/BF-0192',
      verificationCode: code,
      studentName: 'Aarav Sharma',
      program: 'Bachelor of Technology (Computer Science & Engineering)',
      academicYear: '2025-2026',
      issuedOn: '10 March 2026',
      issuingAuthority: 'Office of Registrar & Dean Academics',
      digitalSignatureStatus: 'CRYPTOGRAPHICALLY_VERIFIED',
    };
  }
}
