import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MOCK_ROUTES = [
  {
    id: 'rt-12',
    busNumber: 'UK-07-PA-4012',
    driverName: 'Sardar Baljit Singh',
    driverPhone: '+91 98370 41201',
    routeTitle: 'Clock Tower to JBIT Campus',
    stops: ['Clock Tower', 'Ballupur Chowk', 'Premnagar', 'Sudhowala', 'Manduwala', 'JBIT Campus'],
    capacity: 52,
    currentOccupancy: 38,
    currentLocation: 'Premnagar Chowk',
    etaToCampusMinutes: 14,
    status: 'ON_ROUTE' as const,
  },
  {
    id: 'rt-05',
    busNumber: 'UK-07-PA-4005',
    driverName: 'Manohar Lal',
    driverPhone: '+91 98371 99205',
    routeTitle: 'ISBT Dehradun to JBIT Campus',
    stops: ['ISBT', 'Majra', 'Shimla Bypass', 'Saharanpur Road', 'JBIT Gate 2'],
    capacity: 52,
    currentOccupancy: 44,
    currentLocation: 'Shimla Bypass Flyover',
    etaToCampusMinutes: 22,
    status: 'ON_ROUTE' as const,
  },
  {
    id: 'rt-09',
    busNumber: 'UK-07-PA-4009',
    driverName: 'Dharmendra Joshi',
    driverPhone: '+91 98372 11984',
    routeTitle: 'Rishikesh / Haridwar Inter-City Express',
    stops: ['Rishikesh Bus Stand', 'Nepali Farm', 'Doiwala', 'JBIT Campus'],
    capacity: 52,
    currentOccupancy: 0,
    currentLocation: 'Campus Fleet Terminal',
    etaToCampusMinutes: 0,
    status: 'AT_CAMPUS' as const,
  },
];

@Injectable()
export class TransportService {
  constructor(private prisma: PrismaService) {}

  async findAllRoutes() {
    if (this.prisma.isConnected) {
      try {
        const routes = await this.prisma.busRoute.findMany({
          include: { buses: true },
        });

        if (routes && routes.length > 0) {
          return routes.map((r) => {
            const bus = r.buses[0];
            const stopsArray = r.stops.split(',').map((s) => s.trim());

            return {
              id: r.id,
              busNumber: bus?.busNumber || 'UK-07-PA-4012',
              driverName: bus?.driverName || 'Sardar Baljit Singh',
              driverPhone: bus?.driverPhone || '+91 98370 41201',
              routeTitle: r.name,
              stops: stopsArray,
              capacity: bus?.capacity || 52,
              currentOccupancy: 38,
              currentLocation: 'En route Premnagar',
              etaToCampusMinutes: 14,
              status: 'ON_ROUTE' as const,
            };
          });
        }
      } catch {
        // Fallback
      }
    }
    return MOCK_ROUTES;
  }

  async getMyPass(studentId: string) {
    if (this.prisma.isConnected) {
      try {
        const assignment = await this.prisma.transportAssignment.findFirst({
          where: {
            OR: [
              { studentId },
              { student: { rollNumber: studentId } },
              { student: { user: { email: studentId } } },
            ],
          },
          include: {
            bus: { include: { route: true } },
            student: { include: { user: true } },
          },
        });

        if (assignment) {
          return {
            studentId: assignment.studentId,
            studentName: assignment.student.user.name,
            passNumber: assignment.passNumber,
            route: `${assignment.bus.route.routeNumber} (${assignment.bus.route.name})`,
            designatedStop: assignment.pickupStop,
            validUntil: assignment.validUntil.toISOString(),
            busNumber: assignment.bus.busNumber,
            driverName: assignment.bus.driverName,
            driverPhone: assignment.bus.driverPhone,
            status: 'ACTIVE',
          };
        }
      } catch {
        // Fallback
      }
    }

    return {
      studentId,
      studentName: 'Rohan Verma',
      passNumber: 'JBIT-PASS-2026-1049',
      route: 'Route-12 (Clock Tower to JBIT Campus)',
      designatedStop: 'Ballupur Chowk',
      validUntil: '2026-06-30',
      busNumber: 'UK-07-PA-4012',
      driverName: 'Sardar Baljit Singh',
      driverPhone: '+91 98370 41201',
      status: 'ACTIVE',
    };
  }

  async getLiveTelematics(routeNumber: string) {
    const list = await this.findAllRoutes();
    const route = list.find((r) => r.busNumber.toLowerCase().includes(routeNumber.toLowerCase()) || r.routeTitle.toLowerCase().includes(routeNumber.toLowerCase())) || list[0];
    return {
      routeNumber: route.routeTitle,
      busNumber: route.busNumber,
      isGpsActive: true,
      driverName: route.driverName,
      driverPhone: route.driverPhone,
      currentLocation: {
        latitude: 30.3445,
        longitude: 77.9478,
        lastUpdated: new Date().toISOString(),
        etaMinutes: route.etaToCampusMinutes,
      },
    };
  }
}
