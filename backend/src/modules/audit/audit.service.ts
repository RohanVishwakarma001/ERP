import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MOCK_AUDIT_LOGS = [
  {
    id: 'aud-01',
    user: 'Dr. V. K. Bhatt (HOD CSE)',
    action: 'LOCK_ATTENDANCE_SESSION',
    entity: 'AttendanceSession',
    entityId: 'sess-20260522-P2',
    timestamp: '2026-05-22T11:18:00Z',
    ipAddress: '192.168.10.45 (Campus Wi-Fi Block B)',
  },
  {
    id: 'aud-02',
    user: 'Col. Rajesh Verma (Registrar)',
    action: 'PUBLISH_CIRCULAR',
    entity: 'Notice',
    entityId: 'not-01',
    timestamp: '2026-05-24T09:00:00Z',
    ipAddress: '192.168.1.10 (Admin Block Node)',
  },
];

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return MOCK_AUDIT_LOGS;
  }
}
