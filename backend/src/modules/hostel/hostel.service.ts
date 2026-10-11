import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class HostelService {
  constructor(private prisma: PrismaService) {}

  /** Buildings with real room / bed occupancy counts. */
  async findAll() {
    const buildings = await this.prisma.hostelBuilding.findMany({
      include: { rooms: { include: { beds: { select: { isOccupied: true } } } } },
      orderBy: { name: 'asc' },
    });

    return buildings.map((b) => {
      const beds = b.rooms.flatMap((r) => r.beds);
      return {
        id: b.id,
        name: b.name,
        gender: b.gender,
        floors: b.floors,
        totalRooms: b.rooms.length,
        totalBeds: beds.length,
        occupiedBeds: beds.filter((bed) => bed.isOccupied).length,
      };
    });
  }

  /** Every bed with its occupant (if any). */
  async getHostelRooms() {
    const beds = await this.prisma.hostelBed.findMany({
      include: {
        room: { include: { building: true } },
        allocation: { include: { student: { include: { user: { select: { name: true } }, program: { select: { name: true } } } } } },
      },
      orderBy: [{ room: { building: { name: 'asc' } } }, { room: { roomNumber: 'asc' } }, { bedNumber: 'asc' }],
    });

    return beds.map((b) => ({
      id: b.id,
      buildingName: b.room.building.name,
      roomNumber: b.room.roomNumber,
      floor: b.room.floor,
      bedNumber: b.bedNumber,
      studentName: b.allocation?.student.user.name ?? null,
      studentRoll: b.allocation?.student.rollNumber ?? null,
      studentBranch: b.allocation?.student.program.name ?? null,
      status: b.isOccupied ? ('OCCUPIED' as const) : ('VACANT' as const),
    }));
  }

  async getMyAllocation(studentId: string) {
    const allocation = await this.prisma.hostelAllocation.findUnique({
      where: { studentId },
      include: { bed: { include: { room: { include: { building: true } } } } },
    });
    if (!allocation) throw new NotFoundException('No hostel bed is allocated to you.');

    return {
      building: allocation.bed.room.building.name,
      room: allocation.bed.room.roomNumber,
      floor: allocation.bed.room.floor,
      bed: allocation.bed.bedNumber,
      academicYear: allocation.academicYear,
      allocatedAt: allocation.allocatedAt.toISOString(),
    };
  }
}
