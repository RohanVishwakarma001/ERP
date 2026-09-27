import { io, Socket } from "socket.io-client";
import { tokenStore } from "./token-store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const SOCKET_ORIGIN = API_BASE_URL.replace(/\/api\/v\d+\/?$/, "");

let socket: Socket | null = null;

/** Connects (or reuses an existing connection) to the authenticated campus-events gateway. */
export function getCampusSocket(): Socket {
  if (socket?.connected) return socket;

  socket = io(`${SOCKET_ORIGIN}/campus-events`, {
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
