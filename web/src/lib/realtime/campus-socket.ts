import { io, Socket } from "socket.io-client";
import { env } from "@/config/env";
import { tokenStore } from "@/lib/auth/token-store";

let socket: Socket | null = null;

/** Connects (or reuses the connection) to the authenticated `campus-events` gateway. */
export function connectCampusSocket(): Socket {
  if (socket?.connected) return socket;
  socket = io(`${env.socketOrigin}/campus-events`, {
    auth: { token: tokenStore.get() },
    transports: ["websocket"],
    reconnection: true,
  });
  return socket;
}

export function disconnectCampusSocket() {
  socket?.disconnect();
  socket = null;
}
