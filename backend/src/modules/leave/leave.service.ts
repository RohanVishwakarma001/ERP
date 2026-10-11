import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MOCK_LEAVES = [
  {
    id: 'lv-01',
    userName: 'Dr. V. K. Bhatt',
    role: 'FACULTY',
    leaveType: 'DUTY_LEAVE',
    startDate: '2026-06-15',
    endDate: '2026-06-17',
    reason: 'Attending IEEE International Conference on Distributed Systems (IIT Bombay)',
    status: 'APPROVED',
  },
  {
    id: 'lv-02',
    userName: 'Aarav Sharma',
    role: 'STUDENT',
    leaveType: 'MEDICAL',
    startDate: '2026-05-18',
    endDate: '2026-05-20',
    reason: 'Viral fever (Medical certificate attached)',
    status: 'APPROVED',
  },
];

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return MOCK_LEAVES;
  }

  async create(data: any) {
    return {
      id: `lv-${Date.now()}`,
      ...data,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
  }

  async updateStatus(id: string, status: string) {
    return {
      id,
      status,
      updatedAt: new Date().toISOString(),
    };
  }
}
