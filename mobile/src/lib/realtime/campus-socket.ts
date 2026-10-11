import { io, Socket } from 'socket.io-client';
import { env } from '@/config/env';
import { STORAGE_KEYS, secureStorage } from '@/lib/secure-storage';

let socket: Socket | null = null;

/** Connects (or reuses the connection) to the authenticated `campus-events` gateway. */
export async function connectCampusSocket(): Promise<Socket> {
  if (socket?.connected) return socket;
  socket = io(`${env.socketOrigin}/campus-events`, {
    auth: { token: await secureStorage.get(STORAGE_KEYS.accessToken) },
    transports: ['websocket'],
    reconnection: true,
  });
  return socket;
}

export function disconnectCampusSocket() {
  socket?.disconnect();
  socket = null;
}
