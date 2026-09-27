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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'campus-events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to WebSocket: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from WebSocket: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() room: string) {
    client.join(room);
    return { event: 'joined', room };
  }

  @SubscribeMessage('broadcast_qr')
  handleBroadcastQr(@MessageBody() payload: any) {
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
