import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LeaveRequest, LeaveStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { RoleGroups } from '../../common/constants/role-groups';
import { CreateLeaveDto, UpdateLeaveStatusDto } from './dto/leave.dto';

const APPROVER_ROLES: UserRole[] = [UserRole.SUPER_ADMIN, ...RoleGroups.ACADEMIC_LEADERSHIP];

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  /** Approvers see every request; everyone else sees their own. */
  async findAll(user: AuthUser) {
    const requests = await this.prisma.leaveRequest.findMany({
      where: APPROVER_ROLES.includes(user.role) ? {} : { userId: user.id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return requests.map((r) => this.toView(r, r.user.name));
  }

  async create(user: AuthUser, dto: CreateLeaveDto) {
    if (dto.endDate < dto.startDate) throw new BadRequestException('endDate must be on or after startDate.');
    const request = await this.prisma.leaveRequest.create({
      data: {
        userId: user.id,
        role: user.role,
        leaveType: dto.leaveType,
        startDate: dto.startDate,
        endDate: dto.endDate,
        reason: dto.reason.trim(),
        documentUrl: dto.documentUrl,
      },
    });
    return this.toView(request, user.name);
  }

  async updateStatus(id: string, approver: AuthUser, dto: UpdateLeaveStatusDto) {
    const request = await this.prisma.leaveRequest.findUnique({ where: { id }, include: { user: { select: { name: true } } } });
    if (!request) throw new NotFoundException('Leave request not found.');
    if (request.status !== LeaveStatus.PENDING) throw new BadRequestException(`This request is already ${request.status}.`);
    if (request.userId === approver.id) throw new BadRequestException('You cannot decide on your own leave request.');

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: { status: dto.status, approvedById: approver.id, remarks: dto.remarks },
    });
    return this.toView(updated, request.user.name);
  }

  private toView(r: LeaveRequest, userName: string) {
    return {
      id: r.id,
      userId: r.userId,
      userName,
      role: r.role,
      leaveType: r.leaveType,
      startDate: r.startDate.toISOString().slice(0, 10),
      endDate: r.endDate.toISOString().slice(0, 10),
      reason: r.reason,
      documentUrl: r.documentUrl,
      status: r.status,
      remarks: r.remarks,
      createdAt: r.createdAt.toISOString(),
    };
  }
}
