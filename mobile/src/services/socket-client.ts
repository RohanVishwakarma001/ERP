import { io, Socket } from 'socket.io-client';
import { storageHelper, getApiBaseUrl } from './api-client';

export function getSocketOrigin(): string {
  return getApiBaseUrl().replace(/\/api\/v\d+\/?$/, '');
}

let socket: Socket | null = null;

/** Connects (or reuses an existing connection) to the authenticated campus-events gateway. */
export async function getCampusSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  const token = await storageHelper.getItem('jbit_auth_token');
  const origin = getSocketOrigin();
  socket = io(`${origin}/campus-events`, {
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
