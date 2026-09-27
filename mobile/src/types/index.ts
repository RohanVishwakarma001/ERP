export type UserRole =
  | "STUDENT"
  | "FACULTY"
  | "ADMIN"
  | "HOD"
  | "ACCOUNTANT"
  | "EXAM_OFFICER"
  | "LIBRARIAN"
  | "PLACEMENT_OFFICER"
  | "HOSTEL_WARDEN"
  | "TRANSPORT_MANAGER";

export interface MobileUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  department?: string;
  designation?: string;
  rollNumber?: string;
  semester?: number;
  cgpa?: number;
  overallAttendance?: number;
}

export interface StudentScheduleItem {
  id: string;
  time: string;
  code: string;
  subject: string;
  faculty: string;
  room: string;
  isLab?: boolean;
  status: "UPCOMING" | "LIVE" | "COMPLETED" | "CANCELLED";
}

export interface AttendanceSubjectItem {
  code: string;
  name: string;
  faculty: string;
  attended: number;
  total: number;
  percentage: number;
  status: "NORMAL" | "WARNING" | "CRITICAL";
  minRequired: number;
  neededFor75: number;
}

export interface FacultyClassItem {
  id: string;
  period: number;
  time: string;
  subjectCode: string;
  subjectName: string;
  section: string;
  room: string;
  totalStudents: number;
  markedPresent?: number;
  status: "UPCOMING" | "LIVE" | "COMPLETED";
}

export interface NoticeItem {
  id: string;
  title: string;
  category: "ACADEMIC" | "EXAM" | "CIRCULAR" | "PLACEMENT" | "EMERGENCY";
  date: string;
  author: string;
  summary: string;
  isUrgent?: boolean;
}

export interface PlacementDriveItem {
  id: string;
  company: string;
  logo: string;
  role: string;
  ctc: string;
  eligibility: string;
  deadline: string;
  status: "ELIGIBLE" | "APPLIED" | "SHORTLISTED" | "OFFERED";
  location: string;
}
