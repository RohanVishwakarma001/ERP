/**
 * App-wide types shared across features. Each type mirrors a backend response
 * (endpoint noted above it) — keep them in sync with backend/src/modules/*.
 */

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'HOD'
  | 'FACULTY'
  | 'STUDENT'
  | 'ACCOUNTANT'
  | 'EXAM_OFFICER'
  | 'LIBRARIAN'
  | 'PLACEMENT_OFFICER'
  | 'HOSTEL_WARDEN'
  | 'TRANSPORT_MANAGER';

/** POST /auth/login → user */
export interface MobileUser {
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

export type SlotStatus = 'UPCOMING' | 'LIVE' | 'COMPLETED';

/** GET /timetable/today */
export interface TodaySlot {
  id: string;
  time: string;
  code: string;
  subject: string;
  faculty: string;
  room: string;
  section: string;
  period: number;
  isLab: boolean;
  status: SlotStatus;
}

/** GET /timetable/my */
export interface TimetableSlot {
  id: string;
  dayOfWeek: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT';
  period: number;
  time: string;
  subjectCode: string;
  subjectName: string;
  facultyName: string;
  roomNumber: string;
  section: string;
  isLab: boolean;
  status: SlotStatus;
}

/** GET /attendance/summary → subjects[] */
export interface AttendanceSubjectItem {
  code: string;
  name: string;
  faculty: string;
  attended: number;
  total: number;
  percentage: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  minRequired: number;
  neededFor75: number;
}

/** GET /attendance/summary */
export interface AttendanceSummary {
  overallPercentage: number;
  totalAttended: number;
  totalClasses: number;
  isDebarred: boolean;
  statutoryThreshold: number;
  subjects: AttendanceSubjectItem[];
}

/** GET /faculty/classes/today */
export interface FacultyClassItem {
  id: string;
  period: number;
  time: string;
  subjectCode: string;
  subjectName: string;
  section: string;
  room: string;
  totalStudents: number;
  markedPresent: number;
  status: SlotStatus;
}

/** GET /faculty/me/workload */
export interface FacultyWorkload {
  facultyId: string;
  name: string;
  department: string;
  weeklyContactHours: number;
  aicteStandardHours: number;
  compliancePercentage: number | null;
  assignedClasses: { day: string; period: number; time: string; code: string; name: string; section: string; room: string }[];
}

/** GET /students (roster) */
export interface RosterStudent {
  id: string;
  name: string;
  rollNumber: string;
  section: string | null;
  attendancePercent: number;
}

/** GET /notices */
export interface NoticeItem {
  id: string;
  title: string;
  summary: string;
  category: 'ACADEMIC' | 'EXAM' | 'PLACEMENT' | 'CIRCULAR' | 'EMERGENCY';
  authorName: string;
  isUrgent: boolean;
  publishedAt: string;
}

/** GET /placement/drives */
export interface PlacementDriveItem {
  id: string;
  companyName: string;
  roleTitle: string;
  ctc: string;
  location: string;
  deadline: string;
  minCgpa: number;
  status: 'LIVE' | 'CLOSED';
  myApplicationStatus: 'APPLIED' | 'SHORTLISTED' | 'INTERVIEW_SCHEDULED' | 'OFFERED' | 'REJECTED' | null;
}

/** GET /exams/grade-card */
export interface GradeCard {
  rollNumber: string;
  studentName: string;
  program: string;
  semester: number;
  resultStatus: string;
  sgpa: number | null;
  cgpa: number;
  totalCreditsEarned: number;
  backlogs: number;
  subjects: {
    code: string;
    title: string;
    credits: number;
    totalMarks: number | null;
    maxMarks: number | null;
    grade: string | null;
    status: 'PASS' | 'FAIL' | 'PENDING';
  }[];
}

/** GET /assignments */
export interface AssignmentItem {
  id: string;
  subjectCode: string;
  subjectName: string;
  title: string;
  description: string;
  deadline: string;
  faculty: string;
  maxMarks: number;
  mySubmissionStatus: 'PENDING' | 'SUBMITTED' | 'EVALUATED' | 'RESUBMITTED' | 'LATE' | null;
  myMarks: number | null;
  myFeedback: string | null;
  /** Brief / question paper the faculty member attached, if any. */
  attachmentUrl: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
}

/** GET /attendance/petitions/me */
export interface PetitionItem {
  id: string;
  subjectCode: string | null;
  subjectName: string | null;
  date: string;
  period: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}
