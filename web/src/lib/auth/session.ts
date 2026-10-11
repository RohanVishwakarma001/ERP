import { jwtVerify } from "jose";
import { serverEnv } from "@/config/server-env";
import type { UserRole } from "@/types";

export const ACCESS_COOKIE = "jbit_access";
export const REFRESH_COOKIE = "jbit_refresh";

export interface SessionPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
}

/** Verifies the httpOnly access-token cookie (server only: proxy and route handlers). */
export async function verifyAccessToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(serverEnv.jwtAccessSecret), {
      algorithms: ["HS256"], // must match backend JWT_ALGORITHM
    });
    if (payload.typ === "refresh") return null;
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
