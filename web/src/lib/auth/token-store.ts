// In-memory only access-token holder. Deliberately NOT persisted to localStorage —
// the refresh token lives in an httpOnly cookie (see /api/auth/*) and this access
// token is re-derived from it on every page load via authService.restoreSession().
let accessToken: string | null = null;

export const tokenStore = {
  get(): string | null {
    return accessToken;
  },
  set(token: string | null): void {
    accessToken = token;
  },
};
