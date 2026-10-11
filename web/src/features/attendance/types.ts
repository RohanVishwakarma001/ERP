/** GET /attendance/student */
export interface SubjectAttendance {
  subjectCode: string;
  subjectName: string;
  facultyName: string;
  conducted: number;
  attended: number;
  percentage: number;
  status: "EXCELLENT" | "SAFE" | "WARNING" | "CRITICAL";
  requiredToReach75: number;
}

/** GET /attendance/petitions/me, /attendance/corrections */
export interface AttendancePetition {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  subjectCode: string | null;
  subjectName: string | null;
  date: string;
  period: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  remarks: string | null;
  attachmentUrl: string | null;
  createdAt: string;
}

export interface CreatePetitionInput {
  subjectCode: string;
  date: string;
  period: number;
  reason: string;
}

export interface QrSession {
  qrCodeToken: string;
  expiresInSeconds: number;
  expiresAt: string;
  sessionId: string;
}

export interface ClassPeriod {
  subjectCode: string;
  section: string;
  period: number;
}

export interface ScanResult {
  success: true;
  message: string;
  subject: string;
}
