export type UserRole =
  | "ADMIN"
  | "HOD"
  | "ACCOUNTANT"
  | "EXAM_OFFICER"
  | "LIBRARIAN"
  | "PLACEMENT_OFFICER"
  | "HOSTEL_WARDEN"
  | "TRANSPORT_MANAGER"
  | "FACULTY"
  | "STUDENT";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  department?: string;
  designation?: string;
  employeeId?: string;
  rollNumber?: string;
  program?: string;
  semester?: number;
  phone?: string;
  status: "ACTIVE" | "LOCKED" | "SUSPENDED";
}

export interface AuthSession {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  expiresAt: number | null;
}

export interface LoginCredentials {
  identifier: string; // Email, Employee ID or Roll Number
  password?: string;
  role?: UserRole;
  otp?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  requiresOtp?: boolean;
}
