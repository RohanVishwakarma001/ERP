export type UserRole =
  | "SUPER_ADMIN"
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

/** The signed-in user as returned by the backend's login / refresh responses. */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  designation?: string;
  rollNumber?: string;
  semester?: number;
  cgpa?: number;
  overallAttendance?: number;
}

export interface LoginCredentials {
  /** Email, roll number, enrollment number or employee code. */
  identifier: string;
  password: string;
}
