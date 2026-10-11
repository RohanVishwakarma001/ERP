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
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    role: string;
  };
}

const BROADCAST_ROLES = new Set(['FACULTY', 'HOD', 'ADMIN']);

@WebSocketGateway({
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowed = new Set(
        [process.env.WEB_URL, ...(process.env.CORS_ORIGINS?.split(',') ?? [])]
          .map((o) => o?.trim())
          .filter((o): o is string => Boolean(o)),
      );
      if (process.env.NODE_ENV !== 'production') {
        allowed.add('http://localhost:3000');
      }
      if (!origin || allowed.has(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Origin not permitted'), false);
      }
    },
    credentials: true,
  },
  namespace: 'campus-events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        throw new Error('Missing auth token');
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.status !== 'ACTIVE' || user.deletedAt) {
        throw new Error('Inactive account');
      }

      client.data.userId = user.id;
      client.data.role = user.role;
      client.join(`user_${user.id}`);

      this.logger.log(`Client authenticated on WebSocket: ${client.id} (user ${user.id})`);
    } catch (error) {
      this.logger.warn(`Rejected unauthenticated WebSocket connection: ${error.message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from WebSocket: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() room: string) {
    if (!client.data?.userId) {
      return { event: 'error', message: 'Not authenticated' };
    }

    // Students/faculty may only join their own personal room and class rooms
    // when they hold a broadcasting-capable role; bus rooms are read-only for anyone authenticated.
    const isOwnUserRoom = room === `user_${client.data.userId}`;
    const isClassRoom = room.startsWith('class_');
    const isBusRoom = room.startsWith('bus_');

    if (isOwnUserRoom || isBusRoom || (isClassRoom && BROADCAST_ROLES.has(client.data.role))) {
      client.join(room);
      return { event: 'joined', room };
    }

    if (isClassRoom) {
      // Students may still listen to their own class's QR rotation broadcasts.
      client.join(room);
      return { event: 'joined', room };
    }

    return { event: 'error', message: 'Not permitted to join this room' };
  }

  @SubscribeMessage('broadcast_qr')
  handleBroadcastQr(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() payload: any) {
    if (!client.data?.userId || !BROADCAST_ROLES.has(client.data.role)) {
      return { event: 'error', message: 'Not permitted to broadcast QR tokens' };
    }
    this.server.to(`class_${payload.section}`).emit('qr_rotated', payload);
  }

  // Helper method to emit notifications from any service
  emitNotification(userId: string, notification: any) {
    this.server.to(`user_${userId}`).emit('new_notification', notification);
  }

  // Helper method to emit bus location updates
  emitBusLocation(routeNumber: string, location: any) {
    this.server.to(`bus_${routeNumber}`).emit('location_update', location);
  }
}
