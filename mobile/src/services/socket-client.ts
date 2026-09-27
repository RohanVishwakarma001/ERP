import { io, Socket } from 'socket.io-client';
import { storageHelper } from './api-client';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const SOCKET_ORIGIN = API_BASE_URL.replace(/\/api\/v\d+\/?$/, '');

let socket: Socket | null = null;

/** Connects (or reuses an existing connection) to the authenticated campus-events gateway. */
export async function getCampusSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  const token = await storageHelper.getItem('jbit_auth_token');
  socket = io(`${SOCKET_ORIGIN}/campus-events`, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
  });
  return socket;
}

export function disconnectCampusSocket() {
  socket?.disconnect();
  socket = null;
}
