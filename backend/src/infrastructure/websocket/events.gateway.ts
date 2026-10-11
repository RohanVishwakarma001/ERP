import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfig, corsOriginCheck } from '../../config';
import { PrismaService } from '../prisma/prisma.service';

interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    role: string;
  };
}

export interface QrRotationPayload {
  section: string;
  qrCodeToken: string;
  expiresAt: string;
}

/** Roles allowed to join class rooms and push QR rotations into them. */
const BROADCAST_ROLES = new Set(['FACULTY', 'HOD', 'ADMIN', 'SUPER_ADMIN']);

/** Section names / route numbers: short, no separators that could address another room. */
const ROOM_SUFFIX = /^[A-Za-z0-9 _-]{1,40}$/;

/**
 * Room naming:
 *   user_<userId>   — private notifications (only that user may join)
 *   class_<section> — live QR rotations and scan tallies (teaching staff only — a
 *                     student who could listen here could mark attendance remotely)
 *   bus_<route>     — transport location updates (read-only, anyone authenticated)
 */
@WebSocketGateway({
  cors: { origin: corsOriginCheck, credentials: true },
  namespace: 'campus-events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private config: AppConfig,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ||
        client.handshake.headers.authorization?.replace('Bearer ', '');
      if (!token) throw new Error('Missing auth token');

      const payload = this.jwtService.verify<{ sub: string; typ?: string }>(token, {
        secret: this.config.jwtAccessSecret,
        algorithms: ['HS256'],
      });
      if (payload.typ === 'refresh') throw new Error('Refresh token used as access token');
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.status !== 'ACTIVE' || user.deletedAt) throw new Error('Inactive account');

      client.data.userId = user.id;
      client.data.role = user.role;
      client.join(`user_${user.id}`);
      this.logger.log(`WebSocket client authenticated: ${client.id} (user ${user.id})`);
    } catch (error) {
      this.logger.warn(`Rejected WebSocket connection: ${(error as Error).message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`WebSocket client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() room: unknown) {
    if (!client.data?.userId) return { event: 'error', message: 'Not authenticated' };
    if (typeof room !== 'string') return { event: 'error', message: 'Invalid room' };

    const isOwnRoom = room === `user_${client.data.userId}`;
    const isClassRoom =
      room.startsWith('class_') && ROOM_SUFFIX.test(room.slice(6)) && BROADCAST_ROLES.has(client.data.role);
    const isBusRoom = room.startsWith('bus_') && ROOM_SUFFIX.test(room.slice(4));
    if (!isOwnRoom && !isClassRoom && !isBusRoom) return { event: 'error', message: 'Not permitted to join this room' };

    client.join(room);
    return { event: 'joined', room };
  }

  @SubscribeMessage('broadcast_qr')
  handleBroadcastQr(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() payload: QrRotationPayload) {
    if (!client.data?.userId || !BROADCAST_ROLES.has(client.data.role)) {
      return { event: 'error', message: 'Not permitted to broadcast QR tokens' };
    }
    if (
      typeof payload?.section !== 'string' ||
      !ROOM_SUFFIX.test(payload.section) ||
      typeof payload.qrCodeToken !== 'string' ||
      payload.qrCodeToken.length > 256
    ) {
      return { event: 'error', message: 'Invalid QR payload' };
    }
    // Re-emit only known fields so a client can't smuggle arbitrary data to listeners.
    const { section, qrCodeToken, expiresAt } = payload;
    this.server.to(`class_${section}`).emit('qr_rotated', { section, qrCodeToken, expiresAt: String(expiresAt) });
  }

  /** Pushes an in-app notification to a single user's private room. */
  emitNotification(userId: string, notification: unknown) {
    this.server.to(`user_${userId}`).emit('new_notification', notification);
  }

  /** Pushes a bus position update to everyone tracking that route. */
  emitBusLocation(routeNumber: string, location: unknown) {
    this.server.to(`bus_${routeNumber}`).emit('location_update', location);
  }
}
