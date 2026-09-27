import { create } from 'zustand';
import { MobileUser, UserRole } from '@/types';
import { apiClient, storageHelper } from '@/services/api-client';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: MobileUser | null;
  token: string | null;
  refreshToken: string | null;
  authStatus: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  restoreSession: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setUser: (user: MobileUser) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  authStatus: 'loading',
  isAuthenticated: false,
  isLoading: false,
  error: null,

  restoreSession: async () => {
    set({ authStatus: 'loading' });
    try {
      const storedToken = await storageHelper.getItem('jbit_auth_token');
      const storedUserJson = await storageHelper.getItem('jbit_auth_user');
      const storedRefresh = await storageHelper.getItem('jbit_auth_refresh');

      if (!storedToken || !storedUserJson) {
        set({
          user: null,
          token: null,
          refreshToken: null,
          authStatus: 'unauthenticated',
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      let parsedUser: MobileUser;
      try {
        parsedUser = JSON.parse(storedUserJson);
      } catch {
        await storageHelper.removeItem('jbit_auth_token');
        await storageHelper.removeItem('jbit_auth_user');
        set({
          user: null,
          token: null,
          refreshToken: null,
          authStatus: 'unauthenticated',
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      // Check with backend /auth/me for active session validation
      try {
        const meRes = await apiClient.get<any>('/auth/me');
        const meData = meRes.data;
        if (meData?.id || meData?.email) {
          const updatedUser: MobileUser = {
            ...parsedUser,
            name: meData.name || parsedUser.name,
            email: meData.email || parsedUser.email,
            role: (meData.role || parsedUser.role) as UserRole,
            department: meData.department || parsedUser.department,
            rollNumber: meData.rollNumber || meData.student?.rollNumber || parsedUser.rollNumber,
            semester: meData.semester || meData.student?.semester || parsedUser.semester,
            cgpa: meData.cgpa || meData.student?.cgpa || parsedUser.cgpa,
          };
          await storageHelper.setItem('jbit_auth_user', JSON.stringify(updatedUser));
          set({
            user: updatedUser,
            token: storedToken,
            refreshToken: storedRefresh,
            authStatus: 'authenticated',
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      } catch (err: any) {
        // If 401 Unauthorized, session has expired
        if (err?.response?.status === 401) {
          await storageHelper.removeItem('jbit_auth_token');
          await storageHelper.removeItem('jbit_auth_refresh');
          await storageHelper.removeItem('jbit_auth_user');
          set({
            user: null,
            token: null,
            refreshToken: null,
            authStatus: 'unauthenticated',
            isAuthenticated: false,
            isLoading: false,
          });
          return;
        }
        // If network offline, continue with stored credentials
      }

      set({
        user: parsedUser,
        token: storedToken,
        refreshToken: storedRefresh,
        authStatus: 'authenticated',
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      set({
        user: null,
        token: null,
        refreshToken: null,
        authStatus: 'unauthenticated',
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  login: async (identifier: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.post<any>('/auth/login', {
        identifier: identifier.trim(),
        password: password.trim(),
      });

      const data = res.data;
      const token = data?.accessToken || data?.token;
      const refreshToken = data?.refreshToken;
      const rawUser = data?.user;

      if (!token || !rawUser) {
        throw new Error('Authentication response invalid. Please try again.');
      }

      const authenticatedUser: MobileUser = {
        id: rawUser.id,
        name: rawUser.name,
        email: rawUser.email,
        role: rawUser.role as UserRole,
        department: rawUser.department || 'Computer Science & Engineering',
        designation: rawUser.designation,
        rollNumber: rawUser.rollNumber,
        semester: rawUser.semester,
        cgpa: rawUser.cgpa,
        overallAttendance: rawUser.overallAttendance ?? 84.5,
        avatarUrl:
          rawUser.avatarUrl ||
          (rawUser.role === 'STUDENT'
            ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
            : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
      };

      // Persist in secure storage
      await storageHelper.setItem('jbit_auth_token', token);
      if (refreshToken) {
        await storageHelper.setItem('jbit_auth_refresh', refreshToken);
      }
      await storageHelper.setItem('jbit_auth_user', JSON.stringify(authenticatedUser));
      await storageHelper.setItem('jbit_auth_role', authenticatedUser.role);

      set({
        user: authenticatedUser,
        token,
        refreshToken: refreshToken || null,
        isAuthenticated: true,
        authStatus: 'authenticated',
        isLoading: false,
        error: null,
      });

      return { success: true };
    } catch (err: any) {
      let errMsg = 'Invalid institutional credentials. Please check your Roll/Email/Password.';
      if (err?.response?.data?.message) {
        errMsg = Array.isArray(err.response.data.message)
          ? err.response.data.message[0]
          : err.response.data.message;
      } else if (err?.message && !err?.response) {
        errMsg = 'Unable to reach JBIT Campus ERP server. Check your network.';
      }

      set({
        isLoading: false,
        error: errMsg,
      });

      return { success: false, error: errMsg };
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout').catch(() => {});
    } catch {
      // Ignore network errors on logout
    }

    try {
      await storageHelper.removeItem('jbit_auth_token');
      await storageHelper.removeItem('jbit_auth_refresh');
      await storageHelper.removeItem('jbit_auth_user');
      await storageHelper.removeItem('jbit_auth_role');
    } catch {
      // Safe fallback
    }

    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      authStatus: 'unauthenticated',
      isLoading: false,
      error: null,
    });
  },

  setUser: (user: MobileUser) => set({ user }),
  clearError: () => set({ error: null }),
}));
