import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

/** A bus position older than this is treated as stale rather than live. */
const GPS_STALE_AFTER_MS = 5 * 60 * 1000;

@Injectable()
export class TransportService {
  constructor(private prisma: PrismaService) {}

  /** One row per bus, with its route, live position (if GPS reports one) and pass-holder count. */
  async findAllRoutes() {
    const buses = await this.prisma.bus.findMany({
      include: { route: true, _count: { select: { studentPasses: true } } },
      orderBy: { route: { routeNumber: 'asc' } },
    });

    return buses.map((bus) => {
      const hasLiveFix =
        bus.isGpsActive &&
        bus.currentLat != null &&
        bus.currentLng != null &&
        Date.now() - bus.lastUpdated.getTime() < GPS_STALE_AFTER_MS;

      return {
        id: bus.id,
        routeNumber: bus.route.routeNumber,
        routeTitle: bus.route.name,
        stops: bus.route.stops.split(',').map((s) => s.trim()).filter(Boolean),
        departureTime: bus.route.departureTime,
        busNumber: bus.busNumber,
        driverName: bus.driverName,
        driverPhone: bus.driverPhone,
        capacity: bus.capacity,
        passHolders: bus._count.studentPasses,
        currentPosition: hasLiveFix ? { lat: bus.currentLat, lng: bus.currentLng, at: bus.lastUpdated.toISOString() } : null,
        status: hasLiveFix ? ('ON_ROUTE' as const) : ('NO_GPS_SIGNAL' as const),
      };
    });
  }

  async getMyPass(studentId: string) {
    const pass = await this.prisma.transportAssignment.findUnique({
      where: { studentId },
      include: { bus: { include: { route: true } }, student: { include: { user: { select: { name: true } } } } },
    });
    if (!pass) throw new NotFoundException('You do not have a transport pass.');

    return {
      passNumber: pass.passNumber,
      studentName: pass.student.user.name,
      routeNumber: pass.bus.route.routeNumber,
      routeTitle: pass.bus.route.name,
      designatedStop: pass.pickupStop,
      departureTime: pass.bus.route.departureTime,
      validUntil: pass.validUntil.toISOString(),
      isValid: pass.validUntil > new Date(),
      busNumber: pass.bus.busNumber,
      driverName: pass.bus.driverName,
      driverPhone: pass.bus.driverPhone,
    };
  }

  async getLiveTelematics(routeNumber: string) {
    const routes = await this.findAllRoutes();
    const route = routes.find((r) => r.routeNumber.toLowerCase() === routeNumber.toLowerCase());
    if (!route) throw new NotFoundException(`Route ${routeNumber} not found.`);
    return {
      routeNumber: route.routeNumber,
      busNumber: route.busNumber,
      driverName: route.driverName,
      driverPhone: route.driverPhone,
      currentPosition: route.currentPosition,
      status: route.status,
    };
  }
}
