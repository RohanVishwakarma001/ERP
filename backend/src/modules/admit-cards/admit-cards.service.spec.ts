import { ForbiddenException } from '@nestjs/common';
import { AdmitCardsService } from './admit-cards.service';
import { createDownloadToken, verifyDownloadToken } from './download-token';
import { AppConfig } from '../../config';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

const SECRET = 'test-access-secret-that-is-long-enough-000000';

describe('Admit card download tokens', () => {
  it('round-trips and expires after five minutes', () => {
    const now = Date.UTC(2026, 9, 12, 10, 0, 0);
    const token = createDownloadToken('card-1', 'user-1', SECRET, now);
    expect(verifyDownloadToken(token, SECRET, now)?.aid).toBe('card-1');
    expect(verifyDownloadToken(token, SECRET, now + 4 * 60_000)).not.toBeNull();
    expect(verifyDownloadToken(token, SECRET, now + 6 * 60_000)).toBeNull();
  });

  it('rejects tampering, other secrets and malformed input', () => {
    const token = createDownloadToken('card-1', 'user-1', SECRET);
    const [payload, sig] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ aid: 'card-2', sub: 'user-1', exp: 9_999_999_999 })).toString('base64url');
    expect(verifyDownloadToken(`${forged}.${sig}`, SECRET)).toBeNull();
    expect(verifyDownloadToken(token, `${SECRET}x`)).toBeNull();
    expect(verifyDownloadToken(`${payload}`, SECRET)).toBeNull();
    expect(verifyDownloadToken(`${token}.extra`, SECRET)).toBeNull();
  });
});

describe('AdmitCardsService.approve (fee and attendance checks)', () => {
  let prisma: any;
  let service: AdmitCardsService;
  const admin: AuthUser = { id: 'u-admin', email: 'a@x.edu', name: 'Admin', role: 'ADMIN' };

  const student = (id: string, overrides: Record<string, unknown> = {}) => ({
    id,
    rollNumber: id.toUpperCase(),
    semester: 5,
    isDebarred: false,
    overallAttendance: 88,
    programId: 'prog-cse',
    user: { name: `Student ${id}`, email: `${id}@x.edu`, status: 'ACTIVE' },
    program: { code: 'BTECH_CSE' },
    section: null,
    fees: [{ totalAmount: 60000, pendingAmount: 0, dueDate: new Date('2026-09-30') }],
    ...overrides,
  });

  beforeEach(() => {
    prisma = {
      exam: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'exam-1',
          cycle: 'ODD_2026',
          title: 'End Sem',
          academicYear: '2026-2027',
          status: 'SCHEDULED',
          schedules: [{ subject: { programId: 'prog-cse', semester: 5 } }],
        }),
      },
      student: {
        findMany: jest.fn().mockResolvedValue([
          student('cleared'),
          student('dues', { fees: [{ totalAmount: 60000, pendingAmount: 15000, dueDate: new Date('2026-09-30') }] }),
          student('debarred', { isDebarred: true, overallAttendance: 61 }),
        ]),
      },
      admitCard: { upsert: jest.fn().mockResolvedValue({}), findUnique: jest.fn() },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    service = new AdmitCardsService(prisma as PrismaService, { jwtAccessSecret: SECRET } as unknown as AppConfig);
  });

  it('approves cleared students and skips those with dues or a debarment', async () => {
    const result = await service.approve({ examId: 'exam-1', studentIds: ['cleared', 'dues', 'debarred', 'stranger'] }, admin);

    expect(result.approved).toBe(1);
    expect(prisma.admitCard.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.admitCard.upsert.mock.calls[0][0].create).toMatchObject({ studentId: 'cleared', overridden: false, approvedById: 'u-admin' });
    expect(result.skipped.map((s: { studentId: string }) => s.studentId)).toEqual(['dues', 'debarred', 'stranger']);
    expect(result.skipped[0].reason).toContain('15,000 fees outstanding');
    expect(result.skipped[1].reason).toContain('debarred');
    expect(result.skipped[2].reason).toContain('Not a candidate');
  });

  it('approves despite dues only with an override reason, which is recorded on the card', async () => {
    const result = await service.approve({ examId: 'exam-1', studentIds: ['dues'], overrideReason: 'Instalment plan approved' }, admin);

    expect(result.approved).toBe(1);
    const create = prisma.admitCard.upsert.mock.calls[0][0].create;
    expect(create.overridden).toBe(true);
    expect(create.remarks).toContain('Instalment plan approved');
    expect(prisma.auditLog.create.mock.calls[0][0].data.action).toBe('APPROVE_ADMIT_CARDS_OVERRIDE');
  });

  it("won't let a student download someone else's or a revoked card", async () => {
    const studentUser: AuthUser = { id: 'u-s', email: 's@x.edu', name: 'S', role: 'STUDENT', studentId: 'stu-1' };
    prisma.admitCard.findUnique.mockResolvedValue({ id: 'card-1', studentId: 'stu-2', status: 'APPROVED' });
    await expect(service.createDownloadLink('card-1', studentUser)).rejects.toThrow(ForbiddenException);

    prisma.admitCard.findUnique.mockResolvedValue({ id: 'card-1', studentId: 'stu-1', status: 'REVOKED' });
    await expect(service.createDownloadLink('card-1', studentUser)).rejects.toThrow('revoked');
  });
});
