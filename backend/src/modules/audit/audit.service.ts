import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

const AUDIT_PAGE_SIZE = 200;

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const logs = await this.prisma.auditLog.findMany({
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: AUDIT_PAGE_SIZE,
    });
    return logs.map((l) => ({
      id: l.id,
      user: l.user ? `${l.user.name} (${l.user.role})` : null,
      action: l.action,
      entity: l.entity,
      entityId: l.entityId,
      ipAddress: l.ipAddress,
      timestamp: l.createdAt.toISOString(),
    }));
  }
}
