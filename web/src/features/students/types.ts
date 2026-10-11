export type DebarmentStatus = "ELIGIBLE" | "DEBARRED";

/** GET /students, /students/:id, /students/me */
export interface Student {
  id: string;
  rollNumber: string;
  enrollmentNumber: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  department: string;
  departmentCode: string;
  program: string;
  semester: number;
  section: string | null;
  batch: string;
  cgpa: number;
  attendancePercent: number;
  conductedClasses: number;
  attendedClasses: number;
  isDebarred: boolean;
  debarmentStatus: DebarmentStatus;
  /** Derived from debarment: withheld exactly when debarred. */
  hallTicketStatus: "RELEASED" | "WITHHELD";
  pendingAttendancePetitions: number;
  feesDue: number;
  kycVerified: boolean;
}

export interface StudentFilters {
  semester?: number;
  isDebarred?: boolean;
  section?: string;
  search?: string;
}
